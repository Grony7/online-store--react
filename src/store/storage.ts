export const loadState = <T>(key: string): T | undefined => {
  try {
    const json = localStorage.getItem(key);
    if (json === null) {
      return undefined;
    }
    return JSON.parse(json);
  } catch (e) {
    console.error('Ошибка загрузки состояния:', e);
    return undefined;
  }
};

export const saveState = <T>(state: T, key: string) => {
  try {
    const stateToSave = JSON.stringify(state);
    localStorage.setItem(key, stateToSave);
  } catch (e) {
    console.error('Ошибка сохранения состояния:', e);
  }
};
