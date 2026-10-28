import {
  DndContext, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors,
  type DragEndEvent, type Announcements,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Trip, ResolvedPlace } from '../lib/model';
import type { TripDispatch } from '../hooks/useTrip';
import { DayBlock } from './DayBlock';
import { Button } from './ui/Button';

interface Props {
  trip: Trip;
  activeDayId: string;
  dispatch: TripDispatch;
  onOpen: (p: ResolvedPlace) => void;
}

const announcements: Announcements = {
  onDragStart: () => 'Место поднято. Стрелки вверх и вниз — переместить, пробел — опустить, Escape — отмена.',
  onDragOver: () => undefined,
  onDragEnd: () => 'Место перемещено.',
  onDragCancel: () => 'Перемещение отменено.',
};

export function DayList({ trip, activeDayId, dispatch, onOpen }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const uid = String(active.id);
    const overId = String(over.id);
    if (overId.startsWith('day:')) {
      dispatch({ type: 'moveItem', uid, toDayId: overId.slice(4) });
      return;
    }
    const target = trip.days.find((d) => d.items.some((i) => i.uid === overId));
    if (!target) return;
    dispatch({ type: 'moveItem', uid, toDayId: target.id, index: target.items.findIndex((i) => i.uid === overId) });
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd} accessibility={{ announcements, screenReaderInstructions: { draggable: 'Чтобы переместить место, нажмите пробел, затем стрелки вверх и вниз, и снова пробел.' } }}>
        {trip.days.map((day, i) => (
          <DayBlock
            key={day.id}
            day={day}
            dayIndex={i}
            dayCount={trip.days.length}
            active={day.id === activeDayId}
            onActivate={(id) => dispatch({ type: 'setActive', dayId: id })}
            onRemoveDay={(id) => dispatch({ type: 'removeDay', dayId: id })}
            onOpen={onOpen}
            onRemove={(uid) => dispatch({ type: 'removeItem', uid })}
            onNote={(uid, note) => dispatch({ type: 'setNote', uid, note })}
            onMoveToDay={(uid, idx) => dispatch({ type: 'moveItem', uid, toDayId: trip.days[idx].id })}
          />
        ))}
      </DndContext>
      <Button variant="ghost" className="w-full" onClick={() => dispatch({ type: 'addDay' })}>
        <Plus size={16} /> Добавить день
      </Button>
    </div>
  );
}
