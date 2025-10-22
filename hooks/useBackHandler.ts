import { useEffect } from 'react';

const historyState = { modalOpen: true };

/**
 * A hook to handle the browser's back button for closing modal-like components.
 * When a component is "open", it pushes a state to the browser history. A `popstate`
 * event (like a back button press) will then trigger the provided `onClose` callback.
 * If the component is closed via other UI interactions, this hook cleans up the history stack.
 *
 * @param isOpen - A boolean indicating if the component is currently open.
 * @param onClose - The function to call to close the component. MUST be memoized with `useCallback`.
 */
export const useBackHandler = (isOpen: boolean, onClose: () => void) => {
  useEffect(() => {
    const handlePopState = () => {
      // This event is fired when the user navigates back.
      // We simply call the onClose handler to close our component.
      onClose();
    };

    if (isOpen) {
      // When the component opens, push a new state to the browser history.
      // This ensures that the back button will first trigger a popstate event
      // before navigating away from the page.
      window.history.pushState(historyState, '');
      window.addEventListener('popstate', handlePopState);
    }

    // The cleanup function is crucial. It's called when `isOpen` changes or the component unmounts.
    return () => {
      window.removeEventListener('popstate', handlePopState);

      // This part handles closing the component via UI (e.g., a close button), not the back button.
      // If the component was open (`isOpen` from the previous render was true), it means our history state is still active.
      // We must remove it to prevent breaking the browser's back button behavior.
      if (isOpen && window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
};
