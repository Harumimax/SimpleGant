type DateTask = {
  id: string;
  parentId: string | null;
  startDate: Date | null;
  endDate: Date | null;
};

export type ParentDateUpdate = {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
};

export function recalculateParentDates<T extends DateTask>(tasks: T[]) {
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
    if (resolved.has(taskId)) return;
    if (visiting.has(taskId)) return;
    visiting.add(taskId);

    const childIds = children.get(taskId) ?? [];
    for (const childId of childIds) resolve(childId);

    const task = byId.get(taskId);
    if (task && childIds.length > 0) {
      const boundaries = childIds
        .flatMap((childId) => {
          const child = byId.get(childId);
          return child ? [child.startDate, child.endDate] : [];
        })
        .filter((date): date is Date => date !== null);

      if (boundaries.length > 0) {
        const timestamps = boundaries.map((date) => date.getTime());
        task.startDate = new Date(Math.min(...timestamps));
        task.endDate = new Date(Math.max(...timestamps));
      } else {
        task.startDate = null;
        task.endDate = null;
      }
    }

    visiting.delete(taskId);
    resolved.add(taskId);
  };

  for (const task of tasks) resolve(task.id);
  return tasks.map((task) => byId.get(task.id) as T);
}

export function changedParentDates<T extends DateTask>(before: T[], after: T[]) {
  const beforeById = new Map(before.map((task) => [task.id, task]));
  const parentIds = new Set(
    after
      .map(({ parentId }) => parentId)
      .filter((parentId): parentId is string => parentId !== null),
  );

  return after.flatMap<ParentDateUpdate>((task) => {
    const previous = beforeById.get(task.id);
    if (!parentIds.has(task.id) || !previous) return [];
    if (
      previous.startDate?.getTime() === task.startDate?.getTime() &&
      previous.endDate?.getTime() === task.endDate?.getTime()
    ) {
      return [];
    }
    return [{ id: task.id, startDate: task.startDate, endDate: task.endDate }];
  });
}
