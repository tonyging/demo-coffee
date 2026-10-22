import { useEffect, useRef } from 'react';
import { set, useFormValue, type SlugInputProps } from 'sanity';
import { makeSlug } from './slugify';

/**
 * 網址代稱：新增項目時，名稱停止輸入約 0.6 秒後自動產生，
 * 並在這次編輯中持續跟著名稱更新（避免只用到名稱的第一個字）。
 * 以下情況不再自動變動，避免舊連結失效：
 * - 打開時代稱已經有值（既有項目）
 * - 店家自己改過代稱
 */
export function makeAutoSlugInput(sourceField: string, prefix: string) {
  return function AutoSlugInput(props: SlugInputProps) {
    const source = useFormValue([sourceField]);
    const current = props.value?.current;
    const text = typeof source === 'string' ? source.trim() : '';
    const lastAuto = useRef<string | null>(null);
    useEffect(() => {
      if (props.readOnly || !text) return;
      const following = !current || (lastAuto.current !== null && current === lastAuto.current);
      if (!following) return;
      const next = makeSlug(text, prefix);
      if (next === current) return;
      const timer = setTimeout(() => {
        lastAuto.current = next;
        props.onChange(set({ _type: 'slug', current: next }));
      }, 600);
      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, current]);
    return props.renderDefault(props);
  };
}
