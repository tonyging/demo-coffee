import { useEffect } from 'react';
import { set, useFormValue, type SlugInputProps } from 'sanity';
import { makeSlug } from './slugify';

/**
 * 網址代稱：第一次填好名稱時自動產生，之後不再跟著改名稱變動
 * （否則店家改個字，網址就換了，舊連結會失效）。
 */
export function makeAutoSlugInput(sourceField: string, prefix: string) {
  return function AutoSlugInput(props: SlugInputProps) {
    const source = useFormValue([sourceField]);
    const current = props.value?.current;
    const text = typeof source === 'string' ? source.trim() : '';
    useEffect(() => {
      if (!current && text && !props.readOnly) {
        props.onChange(set({ _type: 'slug', current: makeSlug(text, prefix) }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, current]);
    return props.renderDefault(props);
  };
}
