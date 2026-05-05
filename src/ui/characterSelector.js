import { CHARACTER_OPTIONS } from '../player/characterCatalog.js';

const STORAGE_KEY = 'ironstorm:selected-character';

export function getSavedCharacterId() {
  return window.localStorage.getItem(STORAGE_KEY) ?? CHARACTER_OPTIONS[0].id;
}

export function createCharacterSelector(initialCharacterId, onSelect) {
  const root = document.createElement('aside');
  root.className = 'character-selector';

  const title = document.createElement('h1');
  title.textContent = 'Ironstorm Prototype';
  root.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.textContent = 'Choose a KayKit adventurer, then move with WASD and aim with the mouse.';
  root.appendChild(subtitle);

  const buttonRow = document.createElement('div');
  buttonRow.className = 'character-selector__grid';
  root.appendChild(buttonRow);

  const buttons = new Map();

  for (const option of CHARACTER_OPTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'character-selector__button';
    button.textContent = option.label;
    button.addEventListener('click', async () => {
      if (button.disabled) {
        return;
      }

      setBusy(true, option.id);
      await onSelect(option.id);
      setActive(option.id);
      setBusy(false);
      window.localStorage.setItem(STORAGE_KEY, option.id);
    });

    buttons.set(option.id, button);
    buttonRow.appendChild(button);
  }

  const hint = document.createElement('p');
  hint.className = 'character-selector__hint';
  hint.textContent = 'Scanned and wired: Barbarian, Knight, Mage, Ranger, Rogue, Rogue Hooded.';
  root.appendChild(hint);

  function setActive(characterId) {
    for (const [id, button] of buttons) {
      button.dataset.active = id === characterId ? 'true' : 'false';
    }
  }

  function setBusy(isBusy, activeId = initialCharacterId) {
    for (const [id, button] of buttons) {
      button.disabled = isBusy;
      button.dataset.active = id === activeId ? 'true' : 'false';
    }
  }

  setActive(initialCharacterId);

  return {
    root,
    setActive,
  };
}
