import React from 'react';
import { Zap, Type } from 'lucide-react';
import { AutoCollectNamingMode } from '../../types';
import { SegmentedControl } from '../ui/SegmentedControl';

interface AutoCollectModeBarProps {
  namingMode: AutoCollectNamingMode;
  onChangeNamingMode: (mode: AutoCollectNamingMode) => void;
  isAutoCollectEnabled: boolean;
  onToggleAutoCollect: () => void;
}

/**
 * Строки группы «Пакет»: переключатель автосбора скачанных .guf
 * и выбор, как называть перехваченный файл.
 */
export const AutoCollectModeBar: React.FC<AutoCollectModeBarProps> = ({
  namingMode,
  onChangeNamingMode,
  isAutoCollectEnabled,
  onToggleAutoCollect,
}) => {
  return (
    <>
      <div className="gd-row">
        <span
          className={`gd-row-icon transition-colors duration-300 ${
            isAutoCollectEnabled ? 'gd-row-icon--accent' : ''
          }`}
        >
          <Zap className={isAutoCollectEnabled ? 'fill-current' : ''} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] text-slate-900">Автосбор скачиваний</span>
          <span className="block text-[12px] text-gd-muted truncate">
            {isAutoCollectEnabled ? 'Скачанные .guf добавляются в пакет' : 'На паузе'}
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isAutoCollectEnabled}
          aria-label="Автосбор скачиваний"
          onClick={onToggleAutoCollect}
          title={
            isAutoCollectEnabled
              ? 'Автосбор активен. Нажмите для паузы'
              : 'Автосбор на паузе. Нажмите для включения'
          }
          className="gd-switch"
        />
      </div>

      <div className="gd-row">
        <span className="gd-row-icon">
          <Type />
        </span>
        <span className="flex-1 min-w-0 text-[14px] text-slate-900 truncate">Имя файла</span>
        <SegmentedControl<AutoCollectNamingMode>
          value={namingMode}
          onChange={onChangeNamingMode}
          size="xs"
          options={[
            {
              value: 'pageName',
              label: 'Со страницы',
              title: 'Называть файл по названию открытой страницы в GreenData',
            },
            {
              value: 'original',
              label: 'Исходное',
              title: 'Сохранять исходное имя скачиваемого файла',
            },
          ]}
        />
      </div>
    </>
  );
};
