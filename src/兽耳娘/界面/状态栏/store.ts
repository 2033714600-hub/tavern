import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';
import { reconcile_exploration_squads, reconcile_squad_member_exclusivity } from './util/squadSync';
import {
  build_population_composition_record,
  should_resync_population_composition,
} from './util/populationComposition';
import { unnamed_efficiency_from_cohesion } from './util/campVariableSync';
import { infer_npc_grade_from_skills } from './util/npcGrade';
import { syncFirepitWithFuel, inferCampfireFuelFromStory } from './util/campfire';
import { sync_comprehensive_affairs } from '../../util/comprehensiveAffairsSync';

function sync_npc_grades_from_skills(data: import('../../schema').Schema) {
  for (const npc of _.values(data.具名NPC)) {
    const inferred = infer_npc_grade_from_skills(npc.技能);
    if (npc.档位 !== inferred) {
      npc.档位 = inferred;
    }
  }
  for (const npc of _.values(data.未收入兽耳娘)) {
    const inferred = infer_npc_grade_from_skills(npc.技能);
    if (npc.档位 !== inferred) {
      npc.档位 = inferred;
    }
  }
}

/** 始终读取最新楼层的 stat_data，避免状态栏 iframe 所在楼层落后于开局 AI 回复楼层 */
export const useDataStore = defineMvuDataStore(
  Schema,
  { type: 'message', message_id: 'latest' },
  data => {
    watchEffect(() => {
      reconcile_squad_member_exclusivity(data.value);
      reconcile_exploration_squads(data.value);
      sync_comprehensive_affairs(data.value);
      inferCampfireFuelFromStory(data.value.营地.当前建筑, data.value.营地.篝火燃料);
      syncFirepitWithFuel(data.value.营地.当前建筑, data.value.营地.篝火燃料);
      sync_npc_grades_from_skills(data.value);
    });
    watchEffect(() => {
      const camp = data.value.营地;
      const expected = unnamed_efficiency_from_cohesion(camp.向心力);
      if (camp.无名族人基准效率 !== expected) {
        camp.无名族人基准效率 = expected;
      }
    });
    watchEffect(() => {
      const camp = data.value.营地;
      if (
        !should_resync_population_composition(camp.人口, data.value.具名NPC, camp.族人构成)
      ) {
        return;
      }
      camp.族人构成 = build_population_composition_record(camp.人口, data.value.具名NPC);
    });
  },
);
