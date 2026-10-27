import type { Task, TaskPositionInput } from '../tasks/tasks.api';
import { calculateTaskDuration } from './timeline';

export const MAX_TASK_LEVEL = 4;

function siblingTasks(tasks: Task[], parentId: string | null) {
  return tasks
    .filter((task) => task.parentId === parentId)
    .sort(
      (left, right) =>
        left.orderIndex - right.orderIndex ||
        left.createdAt.localeCompare(right.createdAt),
    );
}

function childIds(tasks: Task[], parentId: string) {
  return tasks
    .filter((task) => task.parentId === parentId)
    .map(({ id }) => id);
}

export function flattenVisibleTasks(tasks: Task[]) {
  const taskIds = new Set(tasks.map(({ id }) => id));
  const result: Task[] = [];

  const append = (parentId: string | null) => {
    for (const task of siblingTasks(tasks, parentId)) {
      result.push(task);
      if (!task.isCollapsed) append(task.id);
    }
  };

  append(null);
  for (const orphan of tasks.filter(
    ({ id, parentId }) => parentId && !taskIds.has(parentId) && !result.some((task) => task.id === id),
  )) {
    result.push(orphan);
  }
  return result;
}

export function taskHasChildren(tasks: Task[], taskId: string) {
  return tasks.some(({ parentId }) => parentId === taskId);
}

export function recalculateParentTaskDates(tasks: Task[]) {
  const byId = new Map(tasks.map((task) => [task.id, { ...task }]));
  const children = new Map<string, string[]>();
  for (const task of tasks) {
    if (!task.parentId) continue;
    const ids = children.get(task.parentId) ?? [];
    ids.push(task.id);
    children.set(task.parentId, ids);
  }

  const resolved = new Set<string>();
  const visiting = new Set<string>();
  const resolve = (taskId: string) => {
    if (resolved.has(taskId) || visiting.has(taskId)) return;
    visiting.add(taskId);
    const childIds = children.get(taskId) ?? [];
    childIds.forEach(resolve);
    const task = byId.get(taskId);
    if (task && childIds.length > 0) {
      const boundaries = childIds.flatMap((childId) => {
        const child = byId.get(childId);
        return child ? [child.startDate, child.endDate].filter(Boolean) as string[] : [];
      });
      task.startDate = boundaries.length > 0 ? boundaries.sort()[0]! : null;
      task.endDate = boundaries.length > 0 ? boundaries.sort().at(-1)! : null;
    }
    visiting.delete(taskId);
    resolved.add(taskId);
  };

  tasks.forEach(({ id }) => resolve(id));
  return tasks.map(({ id }) => {
    const task = byId.get(id)!;
    return {
      ...task,
      duration: calculateTaskDuration(task.startDate, task.endDate),
    };
  });
}

export function countTaskDescendants(tasks: Task[], taskId: string) {
  const visited = new Set<string>();
  const visit = (parentId: string) => {
    for (const id of childIds(tasks, parentId)) {
      if (visited.has(id)) continue;
      visited.add(id);
      visit(id);
    }
  };
  visit(taskId);
  return visited.size;
}

function descendantIds(tasks: Task[], taskId: string) {
  const result = new Set<string>();
  const visit = (parentId: string) => {
    for (const id of childIds(tasks, parentId)) {
      if (result.has(id)) continue;
      result.add(id);
      visit(id);
    }
  };
  visit(taskId);
  return result;
}

function subtreeDepth(tasks: Task[], taskId: string): number {
  const children = childIds(tasks, taskId);
  if (children.length === 0) return 0;
  return 1 + Math.max(...children.map((id) => subtreeDepth(tasks, id)));
}

function deriveLevels(tasks: Task[]) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const cache = new Map<string, number>();
  const resolve = (task: Task): number => {
    const known = cache.get(task.id);
    if (known !== undefined) return known;
    const parent = task.parentId ? byId.get(task.parentId) : undefined;
    const level = parent ? resolve(parent) + 1 : 0;
    cache.set(task.id, level);
    return level;
  };
  return tasks.map((task) => ({ ...task, level: resolve(task) }));
}

function placeTask(
  tasks: Task[],
  taskId: string,
  parentId: string | null,
  insertIndex: number,
) {
  const active = tasks.find(({ id }) => id === taskId);
  if (!active) return null;
  if (parentId && descendantIds(tasks, taskId).has(parentId)) return null;

  const parent = parentId
    ? tasks.find(({ id }) => id === parentId)
    : undefined;
  const nextLevel = parent ? parent.level + 1 : 0;
  if (nextLevel + subtreeDepth(tasks, taskId) > MAX_TASK_LEVEL) return null;

  const next = tasks.map((task) =>
    task.id === taskId ? { ...task, parentId } : task,
  );
  const parentKeys = new Set<string | null>([active.parentId, parentId]);

  for (const key of parentKeys) {
    const siblings = siblingTasks(next, key).filter(({ id }) => id !== taskId);
    if (key === parentId) {
      siblings.splice(Math.min(Math.max(insertIndex, 0), siblings.length), 0, {
        ...active,
        parentId,
      });
    }
    siblings.forEach((sibling, orderIndex) => {
      const target = next.find(({ id }) => id === sibling.id);
      if (target) target.orderIndex = orderIndex;
    });
  }

  return recalculateParentTaskDates(deriveLevels(next));
}

export function indentTask(tasks: Task[], taskId: string) {
  const active = tasks.find(({ id }) => id === taskId);
  if (!active) return null;
  const siblings = siblingTasks(tasks, active.parentId);
  const index = siblings.findIndex(({ id }) => id === taskId);
  const previous = siblings[index - 1];
  if (!previous) return null;
  return placeTask(
    tasks,
    taskId,
    previous.id,
    siblingTasks(tasks, previous.id).length,
  );
}

export function outdentTask(tasks: Task[], taskId: string) {
  const active = tasks.find(({ id }) => id === taskId);
  if (!active?.parentId) return null;
  const parent = tasks.find(({ id }) => id === active.parentId);
  if (!parent) return null;
  const targetSiblings = siblingTasks(tasks, parent.parentId);
  const parentIndex = targetSiblings.findIndex(({ id }) => id === parent.id);
  return placeTask(tasks, taskId, parent.parentId, parentIndex + 1);
}

export function moveTask(
  tasks: Task[],
  activeId: string,
  overId: string,
  horizontalIntent: -1 | 0 | 1,
) {
  if (activeId === overId) {
    return horizontalIntent < 0 ? outdentTask(tasks, activeId) : null;
  }
  const active = tasks.find(({ id }) => id === activeId);
  const over = tasks.find(({ id }) => id === overId);
  if (!active || !over) return null;

  if (horizontalIntent > 0) {
    return placeTask(
      tasks,
      activeId,
      overId,
      siblingTasks(tasks, overId).length,
    );
  }
  if (horizontalIntent < 0) return outdentTask(tasks, activeId);
  if (descendantIds(tasks, activeId).has(overId)) return null;

  const visible = flattenVisibleTasks(tasks);
  const activeIndex = visible.findIndex(({ id }) => id === activeId);
  const overIndex = visible.findIndex(({ id }) => id === overId);
  const targetSiblings = siblingTasks(tasks, over.parentId).filter(
    ({ id }) => id !== activeId,
  );
  const targetIndex = targetSiblings.findIndex(({ id }) => id === overId);
  const insertAfter = activeIndex < overIndex;
  return placeTask(
    tasks,
    activeId,
    over.parentId,
    targetIndex + (insertAfter ? 1 : 0),
  );
}

export function toTaskPositions(tasks: Task[]): TaskPositionInput[] {
  return tasks.map(({ id, parentId, orderIndex }) => ({
    id,
    parentId,
    orderIndex,
  }));
}
