export type DataPanelValueSize = 'text' | 'label';

/** Fixed value-row height shared by loaded content and its skeleton. */
export function getDataPanelValueHeightClass(valueSize?: DataPanelValueSize): 'h-5' | 'h-6' {
  return valueSize === 'label' ? 'h-6' : 'h-5';
}
