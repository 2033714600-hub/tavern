import _ from 'lodash';

/** 解析「坚固木材×1, 藤蔓×2」类材料字符串 */
export function parseMaterialString(materials: string): Record<string, number> {
  if (!materials || /无（|无需|不需要/.test(materials)) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const part of materials.split(/[,，、]/)) {
    const m = part.trim().match(/^(.+?)\s*[×xX]\s*(\d+(?:\.\d+)?)/);
    if (m) {
      result[m[1].trim()] = Number(m[2]);
    }
  }
  return result;
}

export function warehouseHasMaterials(
  materials: Record<string, number>,
  warehouse: Record<string, { 当前: number; 上限: number }>,
): boolean {
  if (_.isEmpty(materials)) {
    return true;
  }
  return _.every(materials, (need, name) => (warehouse[name]?.当前 ?? 0) >= need);
}

export function formatMaterialsRecord(materials: Record<string, number>): string {
  return _.entries(materials)
    .map(([name, qty]) => `${name}×${qty}`)
    .join('，');
}

/** 与工作队列卡片一致：逗号分隔 */
export function formatMaterialsCatalog(materials: Record<string, number>): string {
  return _.entries(materials)
    .map(([name, qty]) => `${name}×${qty}`)
    .join(', ');
}
