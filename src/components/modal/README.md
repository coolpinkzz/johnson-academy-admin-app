# Modal System

A comprehensive modal system for React applications with TypeScript support, built on top of React Context and custom hooks.

## Features

- 🎯 **Easy to use**: Simple `openModal` and `closeModal` functions
- 🎨 **Flexible**: Multiple sizes, customizable appearance
- ⌨️ **Accessible**: Keyboard support (Escape key), focus management
- 📱 **Responsive**: Works on all screen sizes
- 🔒 **Type-safe**: Full TypeScript support
- 🎭 **Multiple modals**: Support for stacking multiple modals
- 🎪 **Customizable**: Configurable close behavior, titles, and content

## Quick Start

### 1. Wrap your app with ModalProvider

```tsx
import { ModalProvider } from "@/components/modal";

function App() {
  return (
    <ModalProvider>
      <YourApp />
    </ModalProvider>
  );
}
```

### 2. Add ModalContainer to your layout

```tsx
import { ModalContainer } from "@/components/modal";

function Layout() {
  return (
    <div>
      <YourContent />
      <ModalContainer />
    </div>
  );
}
```

### 3. Use the useModal hook

```tsx
import { useModal } from "@/components/modal";

function MyComponent() {
  const { openModal, closeModal } = useModal();

  const handleOpenModal = () => {
    openModal({
      title: "My Modal",
      content: <div>Modal content here</div>,
      size: "md",
    });
  };

  return <button onClick={handleOpenModal}>Open Modal</button>;
}
```

## API Reference

### useModal Hook

The `useModal` hook provides the following functions and properties:

```tsx
const { openModal, closeModal, closeAllModals, isModalOpen, activeModals } =
  useModal();
```

#### openModal(modalData)

Opens a new modal and returns its ID.

```tsx
const modalId = openModal({
  title: "Modal Title",
  content: <YourComponent />,
  size: "md", // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick: true,
  closeOnEscape: true,
  showCloseButton: true,
  onClose: () => console.log("Modal closed"),
});
```

#### closeModal(id)

Closes a specific modal by ID.

```tsx
closeModal(modalId);
```

#### closeAllModals()

Closes all open modals.

```tsx
closeAllModals();
```

#### isModalOpen(id)

Checks if a specific modal is open.

```tsx
const isOpen = isModalOpen(modalId);
```

#### activeModals

Array of currently open modals.

```tsx
const openModals = activeModals;
```

### Modal Sizes

- `sm`: Small modal (max-width: 384px)
- `md`: Medium modal (max-width: 448px) - Default
- `lg`: Large modal (max-width: 512px)
- `xl`: Extra large modal (max-width: 576px)
- `full`: Full width modal with margins

## Examples

### Simple Modal

```tsx
const { openModal } = useModal();

openModal({
  title: "Success",
  content: <p>Operation completed successfully!</p>,
});
```

### Form Modal

```tsx
const { openModal } = useModal();

openModal({
  title: "Add User",
  size: "lg",
  content: (
    <form className="space-y-4">
      <input type="text" placeholder="Name" />
      <input type="email" placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  ),
});
```

### Confirmation Modal

```tsx
const { openModal } = useModal();

const handleDelete = () => {
  openModal({
    title: "Confirm Delete",
    size: "sm",
    content: (
      <div className="space-y-4">
        <p>Are you sure you want to delete this item?</p>
        <div className="flex justify-end space-x-2">
          <button onClick={() => closeModal("")}>Cancel</button>
          <button onClick={deleteItem}>Delete</button>
        </div>
      </div>
    ),
  });
};
```

### Custom Close Behavior

```tsx
openModal({
  title: "Important Action",
  content: <ImportantForm />,
  closeOnOverlayClick: false, // Prevent accidental closing
  closeOnEscape: false, // Prevent escape key closing
  showCloseButton: false, // Hide close button
  onClose: () => {
    // Custom close logic
    if (hasUnsavedChanges) {
      showWarning();
      return;
    }
    closeModal(modalId);
  },
});
```

## Styling

The modal system uses Tailwind CSS classes and can be customized by modifying the `Modal` component in `src/components/ui/modal.tsx`.

## Accessibility

- Modals are properly focused and managed
- Escape key support for closing modals
- Screen reader support with proper ARIA attributes
- Body scroll is prevented when modals are open
- Focus trap within modal content

## Best Practices

1. **Always provide a title** for better accessibility
2. **Use appropriate sizes** for your content
3. **Handle form submissions** properly before closing
4. **Provide clear close actions** for user actions
5. **Use onClose callback** for cleanup operations
6. **Consider mobile users** when choosing modal sizes

## Troubleshooting

### Modal not opening

- Ensure `ModalProvider` wraps your component
- Check that `ModalContainer` is rendered in your layout
- Verify the `useModal` hook is called within the provider context

### Modal not closing

- Check if `closeOnOverlayClick` is set to `false`
- Verify the `onClose` callback isn't preventing closure
- Ensure the modal ID is correct when calling `closeModal`

### Styling issues

- Check Tailwind CSS is properly configured
- Verify the modal component classes are not conflicting
- Ensure z-index values are appropriate for your layout
