import React from 'react';
import { Zap } from 'lucide-react';
import { AutoCollectNamingMode } from '../../types';
import { SegmentedControl } from '../ui/SegmentedControl';

interface AutoCollectModeBarProps {
  namingMode: AutoCollectNamingMode;
  onChangeNamingMode: (mode: AutoCollectNamingMode) => void;
  isAutoCollectEnabled: boolean;
  onToggleAutoCollect: () => void;
}

/**
 * Одна строка группы «Пакет»: автосбор скачанных .guf (переключатель)
 * и режим имени перехваченного файла.
 */
export const AutoCollectModeBar: React.FC<AutoCollectModeBarProps> = ({
  namingMode,
  onChangeNamingMode,
  isAutoCollectEnabled,
  onToggleAutoCollect,
}) => (
  <div className="gd-row">
    <span
      className={`gd-row-icon transition-colors duration-300 ${isAutoCollectEnabled ? 'gd-row-icon--accent' : ''}`}
      title={isAutoCollectEnabled ? 'Скачанные файлы .guf добавляются в пакет' : 'Автосбор на паузе'}
    >
      <Zap className={isAutoCollectEnabled ? 'fill-current' : ''} />
    </span>
    <span className="min-w-0 flex-1 truncate text-[13.5px] text-slate-900">Автосбор</span>
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
    <button
      type="button"
      role="switch"
      aria-checked={isAutoCollectEnabled}
      aria-label="Автосбор скачиваний"
      onClick={onToggleAutoCollect}
      title={isAutoCollectEnabled ? 'Автосбор включён. Нажмите, чтобы приостановить' : 'Автосбор на паузе. Нажмите, чтобы включить'}
      className="gd-switch"
    />
  </div>
);
