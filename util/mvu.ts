<<<<<<< HEAD
import { isStatusBarLocalMutation } from '@util/common';
import { klona } from 'klona';
import { StoreDefinition } from 'pinia';

/** pull 时保留本地已有、远端尚未写入的键（如 UI 刚新建的编队/队列项） */
function merge_local_only_record_keys(
  local: Record<string, unknown>,
  remote: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const local_record = local[key];
  const remote_record = remote[key];
  if (!local_record || typeof local_record !== 'object' || Array.isArray(local_record)) {
    return remote;
  }
  if (!remote_record || typeof remote_record !== 'object' || Array.isArray(remote_record)) {
    return { ...local, [key]: klona(local_record) };
  }
  const local_obj = local_record as Record<string, unknown>;
  const remote_obj = remote_record as Record<string, unknown>;
  const local_only = _.pickBy(local_obj, (_, name) => !(name in remote_obj));
  if (_.isEmpty(local_only)) {
    return remote;
  }
  return {
    ...remote,
    [key]: { ...remote_obj, ...local_only },
  };
}

function merge_pulled_stat_data<T extends Record<string, unknown>>(local: T, remote: T): T {
  let merged = klona(remote) as T;
  for (const key of ['探索编队', '工作队列'] as const) {
    merged = merge_local_only_record_keys(local, merged, key) as T;
  }
  return merged;
}

function pull_stat_data<T extends z.ZodObject>(
  schema: T,
  variable_option: VariableOption,
  data: Ref<z.infer<T>>,
  ignoreUpdates: (fn: () => void) => void,
) {
  const stat_data = _.get(getVariables(variable_option), 'stat_data', {});
  const result = schema.safeParse(stat_data);
  if (result.error) {
    return;
  }
  const merged = merge_pulled_stat_data(
    data.value as Record<string, unknown>,
    result.data as Record<string, unknown>,
  ) as z.infer<T>;
  if (!_.isEqual(data.value, merged)) {
    ignoreUpdates(() => {
      data.value = merged;
    });
  }
}

=======
import { StoreDefinition } from 'pinia';

>>>>>>> 75341c6e42a9de4002601a50d28fd5c0a0bfa070
export function defineMvuDataStore<T extends z.ZodObject>(
  schema: T,
  variable_option: VariableOption,
  additional_setup?: (data: Ref<z.infer<T>>) => void,
): StoreDefinition<`mvu_data.${string}`, { data: Ref<z.infer<T>> }> {
  if (
    variable_option.type === 'message' &&
    (variable_option.message_id === undefined || variable_option.message_id === 'latest')
  ) {
    variable_option.message_id = -1;
  }

  return defineStore(
    `mvu_data.${_(variable_option)
      .entries()
      .sortBy(entry => entry[0])
      .map(entry => entry[1])
      .join('.')}`,
    errorCatched(() => {
<<<<<<< HEAD
      const stat_data = _.get(getVariables(variable_option), 'stat_data', {});
      const parsed = schema.safeParse(stat_data, { reportInput: true });
      if (!parsed.success) {
        console.error('[MVU store] stat_data 校验失败，将尝试用 schema 默认值恢复', parsed.error);
      }
      const data = ref(
        (parsed.success ? parsed.data : schema.parse({}, { reportInput: true })) as z.infer<T>,
      ) as Ref<z.infer<T>>;
=======
      const data = ref(
        schema.parse(_.get(getVariables(variable_option), 'stat_data', {}), { reportInput: true }),
      ) as Ref<z.infer<T>>;
      if (additional_setup) {
        additional_setup(data);
      }

      useIntervalFn(() => {
        const stat_data = _.get(getVariables(variable_option), 'stat_data', {});
        const result = schema.safeParse(stat_data);
        if (result.error) {
          return;
        }
        if (!_.isEqual(data.value, result.data)) {
          ignoreUpdates(() => {
            data.value = result.data;
          });
          if (!_.isEqual(stat_data, result.data)) {
            updateVariablesWith(variables => _.set(variables, 'stat_data', result.data), variable_option);
          }
        }
      }, 2000);
>>>>>>> 75341c6e42a9de4002601a50d28fd5c0a0bfa070

      const { ignoreUpdates } = watchIgnorable(
        data,
        new_data => {
          const result = schema.safeParse(new_data);
          if (result.error) {
            return;
          }
          if (!_.isEqual(new_data, result.data)) {
            ignoreUpdates(() => {
              data.value = result.data;
            });
          }
          updateVariablesWith(variables => _.set(variables, 'stat_data', result.data), variable_option);
        },
        { deep: true },
      );

<<<<<<< HEAD
      const pull = () => {
        if (isStatusBarLocalMutation()) {
          return;
        }
        pull_stat_data(schema, variable_option, data, ignoreUpdates);
      };

      if (additional_setup) {
        additional_setup(data);
      }

      useIntervalFn(pull, 2000);

      if (typeof eventOn === 'function') {
        eventOn(tavern_events.GENERATION_ENDED, pull);
        eventOn(tavern_events.MESSAGE_UPDATED, pull);
        if (typeof Mvu !== 'undefined') {
          eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, pull);
        }
      }

=======
>>>>>>> 75341c6e42a9de4002601a50d28fd5c0a0bfa070
      return { data };
    }),
  );
}
