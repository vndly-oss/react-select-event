/** Simulate user events on react-select dropdowns */

import { fireEvent, findByText, wait } from "@testing-library/dom";

// find the react-select container from its input field 🤷
function getReactSelectContainerFromInput(input: HTMLElement): HTMLElement {
  return input.parentNode!.parentNode!.parentNode!.parentNode!
    .parentNode as HTMLElement;
}

// focus the `react-select` input field
export const focus = (input: HTMLElement) => {
  fireEvent.focus(input);
  fireEvent.keyDown(input, {
    key: "ArrowDown",
    keyCode: 40,
    code: 40
  });
};

// type text in the input field
const type = (input: HTMLElement, text: string) => {
  fireEvent.change(input, { target: { value: text } });
};

// press the "clear" button, and reset various states
const clear = async (input: HTMLElement, clearButton: Element) => {
  fireEvent.mouseDown(clearButton);
  fireEvent.click(clearButton);
  // react-select will prevent the menu from opening, and asynchronously focus the select field...
  await wait();
  input.blur();
};

interface Config {
  /** A container where the react-select dropdown gets rendered to.
   *  Useful when rendering the dropdown in a portal using `menuPortalTarget`.
   */
  container?: HTMLElement;
}

/**
 * Utility for selecting a value in a `react-select` dropdown.
 * @param input The input field (eg. `getByLabelText('The label')`)
 * @param optionOrOptions The display name(s) for the option(s) to select
 * @param config Optional config options
 * @param config.container A container for the react-select and its dropdown (defaults to the react-select container)
 *                         Useful when rending the dropdown to a portal using react-select's `menuPortalTarget`
 */
export const select = async (
  input: HTMLElement,
  optionOrOptions: string | RegExp | Array<string | RegExp>,
  config: Config = {}
) => {
  const options = Array.isArray(optionOrOptions)
    ? optionOrOptions
    : [optionOrOptions];
  const container = config.container || getReactSelectContainerFromInput(input);

  // Select the items we care about
  for (const option of options) {
    focus(input);

    // only consider accessible elements
    const optionElement = await findByText(container, option, {
      // @ts-ignore invalid rtl types :'(
      ignore: ":not([tabindex])"
    });
    fireEvent.click(optionElement);
  }
};

interface CreateConfig extends Config {
  createOptionText?: string | RegExp;
}
/**
 * Utility for creating and selecting a value in a Creatable `react-select` dropdown.
 * @async
 * @param input The input field (eg. `getByLabelText('The label')`)
 * @param option The display name for the option to type and select
 * @param config Optional config options
 * @param config.container A container for the react-select and its dropdown (defaults to the react-select container)
 *                         Useful when rending the dropdown to a portal using react-select's `menuPortalTarget`
 * @param config.createOptionText Custom label for the "create new ..." option in the menu (string or regexp)
 */
export const create = async (
  input: HTMLElement,
  option: string,
  config: CreateConfig = {}
) => {
  const createOptionText = config.createOptionText || /^Create "/;
  focus(input);
  type(input, option);

  fireEvent.change(input, { target: { value: option } });
  await select(input, createOptionText, config);

  await findByText(getReactSelectContainerFromInput(input), option);
};

/**
 * Utility for clearing the first value of a `react-select` dropdown.
 * @param input The input field (eg. `getByLabelText('The label')`)
 */
export const clearFirst = async (input: HTMLElement) => {
  const container = getReactSelectContainerFromInput(input);
  // The "clear" button is the first svg element that is hidden to screen readers
  const clearButton = container.querySelector('svg[aria-hidden="true"]')!;
  await clear(input, clearButton);
};

/**
 * Utility for clearing all values in a `react-select` dropdown.
 * @param input The input field (eg. `getByLabelText('The label')`)
 */
export const clearAll = async (input: HTMLElement) => {
  const container = getReactSelectContainerFromInput(input);
  // The "clear all" button is the penultimate svg element that is hidden to screen readers
  // (the last one is the dropdown arrow)
  const elements = container.querySelectorAll('svg[aria-hidden="true"]');
  const clearAllButton = elements[elements.length - 2];
  await clear(input, clearAllButton);
};

export default { select, create, clearFirst, clearAll };
