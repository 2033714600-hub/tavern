import type { WorkProject } from './workProjectCatalog';

const UNLOCK_MAP: Record<string, string | null> = {
  硬化长矛: '骨质武器阶段',
  防身短棒: null,
  骨刀: '骨质武器阶段',
  钻木取火套装: '火源与热加工',
  韧化藤绳: '纤维与编织',
  缝合兽皮衣: '骨针与制皮',
  捣碎止血草糊: '自然辨识',
  简易绳套陷阱: '被动捕猎与陷阱',
  制备引火物: null,
  硬木背篓: '基础负重',
  石砌防风火塘: '火塘与避风',
  加固兽皮窝棚: '火塘与避风',
  削尖木桩护栏: '火塘与避风',
  烟熏肉架: '火源与热加工',
  垫木物资棚: '纤维与编织',
  公共篝火广场: '公平分食制',
  食物辨识: null,
  材料分级认知: null,
  水源过滤认知: '自然辨识',
  公平分食制: null,
  木制武器阶段: null,
  骨质武器阶段: '木制武器阶段',
  石制武器阶段: '骨质武器阶段',
  火源与热加工: null,
  纤维与编织: null,
  骨针与制皮: '骨质武器阶段',
  火塘与避风: null,
  被动捕猎与陷阱: null,
  基础负重: '纤维与编织',
  自然辨识: null,
};

const PREREQUISITE_TEXT: Record<string, string> = {
  硬化长矛: '需先完成研发「骨质武器阶段」',
  骨刀: '需先完成研发「骨质武器阶段」',
  钻木取火套装: '需先完成研发「火源与热加工」',
  韧化藤绳: '需先完成研发「纤维与编织」',
  缝合兽皮衣: '需先完成研发「骨针与制皮」',
  捣碎止血草糊: '需先完成研发「自然辨识」',
  简易绳套陷阱: '需先完成研发「被动捕猎与陷阱」',
  硬木背篓: '需先完成研发「基础负重」',
  石砌防风火塘: '需先完成研发「火塘与避风」',
  加固兽皮窝棚: '需先完成研发「火塘与避风」',
  削尖木桩护栏: '需先完成研发「火塘与避风」',
  烟熏肉架: '需先完成研发「火源与热加工」',
  垫木物资棚: '需先完成研发「纤维与编织」',
  公共篝火广场: '需先完成学习「公平分食制」',
  水源过滤认知: '需先完成研发「自然辨识」',
  骨质武器阶段: '需先完成研发「木制武器阶段」',
  石制武器阶段: '需先完成研发「骨质武器阶段」',
  骨针与制皮: '需先完成研发「骨质武器阶段」',
  基础负重: '需先完成研发「纤维与编织」',
};

export function projectUnlockTech(project: WorkProject): string | null {
  return UNLOCK_MAP[project.name] ?? null;
}

export function isProjectUnlocked(project: WorkProject, unlocked: string[]): boolean {
  const tech = projectUnlockTech(project);
  if (!tech) {
    return true;
  }
  return unlocked.includes(tech);
}

export function projectPrerequisite(project: WorkProject): string {
  return PREREQUISITE_TEXT[project.name] ?? `需先解锁「${projectUnlockTech(project)}」`;
}
