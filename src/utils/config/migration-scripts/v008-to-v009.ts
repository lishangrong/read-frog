import deepmerge from 'deepmerge'

export function migrate(oldConfig: any): any {
  return deepmerge(oldConfig, {
    translate: {
      page: {
        displayMode: 'bilingual',
        contextAware: true,
      },
    },
  })
}
