/**
 * Event highlighting utility for calendar notifications
 */

/**
 * Find and highlight a calendar event by ID
 */
export const highlightEventById = (targetId: string, onComplete?: () => void) => {
  let attempts = 0;
  const maxAttempts = 10;

  const findAndHighlightElement = () => {
    attempts++;
    console.log(`🔍 Attempt ${attempts}/${maxAttempts} to find element`);

    const selectors = [
      `[data-event-id="${targetId}"]`,
      `.fc-event[data-event-id="${targetId}"]`,
      `#${targetId}`
    ];

    let eventElement: Element | null = null;

    for (const selector of selectors) {
      eventElement = document.querySelector(selector);
      if (eventElement) {
        console.log(`✅ Found element with selector: ${selector}`);
        break;
      }
    }

    if (!eventElement) {
      const allEvents = document.querySelectorAll('.fc-event');
      console.log(`🔍 Searching through ${allEvents.length} calendar events for ID match`);

      for (const event of allEvents) {
        if (event.getAttribute('data-event-id') === targetId || event.id === targetId) {
          eventElement = event;
          console.log('✅ Found element by ID match');
          break;
        }
      }
    }

    if (eventElement && eventElement instanceof HTMLElement) {
      applyHighlight(eventElement);
      onComplete?.();
    } else if (attempts < maxAttempts) {
      setTimeout(findAndHighlightElement, 1000);
    } else {
      console.error('❌ Could not find event element after', maxAttempts, 'attempts');
    }
  };

  setTimeout(findAndHighlightElement, 2000);
};

/**
 * Apply highlight effect to an element
 */
const applyHighlight = (eventElement: HTMLElement) => {
  console.log('🎉 Element found! Applying highlight');

  eventElement.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center'
  });

  eventElement.classList.add('highlight-notification-event');

  setTimeout(() => {
    console.log('🔄 Removing highlight after 5 seconds');
    eventElement.classList.remove('highlight-notification-event');
  }, 5000);
};
