import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { GanttAggregate } from '../gantt/gantt.api';
import { PublicGanttViewer } from './PublicGanttViewer';

const aggregate: GanttAggregate = {
  project: {
    id: 'project-1',
    name: 'Публичный план',
    startDate: '2026-11-01',
    endDate: '2026-11-14',
    excludeNonWorkingDays: true,
    createdAt: '',
    updatedAt: '',
    columns: [
      {
        id: 'title-column',
        name: 'Название',
        key: 'title',
        orderIndex: 0,
        isVisible: true,
        isDefault: true,
      },
      {
        id: 'status-column',
        name: 'Статус',
        key: 'status',
        orderIndex: 1,
        isVisible: true,
        isDefault: true,
      },
    ],
  },
  tasks: [
    {
      id: 'task-1',
      projectId: 'project-1',
      parentId: null,
      orderIndex: 0,
      level: 0,
      title: 'Подготовить релиз',
      workType: 'Разработка',
      assignee: 'Максим',
      estimate: null,
      comment: 'Проверить публичное описание',
      duration: 5,
      status: 'В работе',
      startDate: '2026-11-02',
      endDate: '2026-11-06',
      color: 'sage',
      includeInDuration: true,
      periods: [],
      isCollapsed: false,
      customFields: {},
      createdAt: '',
      updatedAt: '',
    },
  ],
  milestones: [],
  nonWorkingDays: [],
  stickers: [{
    id: 'sticker-1',
    projectId: 'project-1',
    text: 'Проверить договор',
    color: 'amber',
    xDayOffset: 2,
    yRowOffset: 0,
    size: 160,
    zIndex: 0,
    createdAt: '',
    updatedAt: '',
  }],
};

describe('PublicGanttViewer', () => {
  it('shows saved project data without editing controls', () => {
    const onTaskDetails = vi.fn();
    render(<PublicGanttViewer {...aggregate} onTaskDetails={onTaskDetails} />);

    fireEvent.click(screen.getByRole('button', { name: 'Подготовить релиз' }));

    expect(onTaskDetails).toHaveBeenCalledWith(aggregate.tasks[0]);
    expect(screen.getByRole('region', { name: 'Публичная диаграмма Ганта' })).toHaveClass('lg:flex');
    expect(screen.getByText(/требуется окно шириной не менее 1024 пикселей/i)).toBeInTheDocument();
    expect(screen.getByText('В работе')).toBeInTheDocument();
    const sticker = screen.getByLabelText('Стикер: Проверить договор');
    expect(sticker).toHaveStyle({ left: '72px', width: '160px', height: '160px' });
    expect(screen.queryByRole('textbox', { name: 'Текст стикера' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Добавить задачу' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сохранить изменения' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /удалить|редактировать/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Месяцы' }));
    expect(screen.getByRole('region', { name: 'Горизонтальная прокрутка временной шкалы' }).firstElementChild).toHaveAttribute('data-timeline-scale', 'months');
    expect(sticker).toHaveStyle({ left: '12px', width: '160px', height: '160px' });

    fireEvent.click(screen.getByRole('button', { name: 'Скрыть дополнительные колонки' }));
    expect(screen.queryByText('Статус')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Таблица задач' }).parentElement).toHaveAttribute('data-columns-collapsed', 'true');
  });
});
