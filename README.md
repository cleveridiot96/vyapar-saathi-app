# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## Git Actions: How to Save Your Code

To save your work and push it to a GitHub repository, follow the step-by-step instructions in the new guide:

**[➡️ Click here for the How to Commit Guide](./HOW_TO_COMMIT.md)**

---

## Application Architecture: The "Backend-less" Backend

A key design feature of this application is its ability to run entirely offline. This is achieved by treating your web browser as its own self-contained backend.

### How It Works

1.  **In-Memory Storage**: When the application loads, all of your data—masters, purchases, sales, and other transactions—is held directly in your browser's memory. This is managed primarily by React's `useState` hooks within central "providers" like `TransactionsProvider`.

2.  **No Internet Required**: Because all data and logic reside within the browser, the application does not need to communicate with a remote server to function. All calculations, filtering, and data manipulation happen instantly on your device.

3.  **Data Persistence**: The primary trade-off for this speed and offline capability is that the data is **ephemeral**. It will be **lost if you close the browser tab or perform a hard refresh**.

4.  **Backup & Restore**: To permanently save your work, you must use the **Backup & Restore** feature. This allows you to download all your current application data into a single file on your computer and upload it again during a future session.

This client-side approach ensures maximum performance and full offline functionality.

---

## Core UI Components Explained

Let's peel back the layers and look directly at the code that powers both the simple and smart dropdowns. Seeing the implementation will make the concepts we discussed crystal clear.

### The Simple Dropdown (`Select`)

This is your standard, basic dropdown. You see it when you need to pick from a small, predefined set of choices, like "Payment Method" (Cash, Bank, UPI) or "Commission Type" (Percentage, Fixed).

**File of Interest:** `src/components/ui/select.tsx` (the component itself) and any form that uses it, like `src/components/app/payments/AddPaymentForm.tsx`.

**How it Works & Connects:**

It works just like a standard HTML `<select>` element but is styled professionally. The form that uses this dropdown is in complete control. It provides two essential props:

*   **`value`**: The currently selected value (e.g., "Cash").
*   **`onValueChange`**: A function to call when the user selects a new option.

#### Component Code

This component is fundamentally a styled wrapper around a library called Radix UI, which provides the core accessibility and behavior for UI primitives.

```tsx
// Simplified from src/components/ui/select.tsx

// These are imported from the Radix UI library
import * as SelectPrimitive from "@radix-ui/react-select" 
import { Check, ChevronDown } from "lucide-react"

// The main component that holds the state (e.g., which item is selected)
const Select = SelectPrimitive.Root

// The part you click to open the dropdown
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger ref={ref} className={...}>
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))

// The individual option in the list
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={...} {...props}>
    <span className="absolute left-2 ...">
      <SelectPrimitive.ItemIndicator>
        <Check />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
```

**Key Takeaways from the Code:**

*   **Delegation:** Notice that our `Select` component doesn't have any complex state logic (`useState`, `useEffect`). It's almost entirely delegating its work to `SelectPrimitive` from Radix UI.
*   **Styling:** Its main job is to apply `className` styles (using `cn` and tailwind) to the Radix components to make them look consistent with our app's theme.
*   **Composition:** It's built by composing smaller parts: a `Root`, a `Trigger`, a `Content` panel, and `Items`.

#### Usage Example

Here is how a parent form, like `AddPaymentForm`, uses the `Select` component.

```tsx
// Simplified from src/components/app/payments/AddPaymentForm.tsx

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormControl } from "@/components/ui/form";

// ... inside the form component
<FormField
  control={form.control} // From react-hook-form
  name="paymentMethod"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Payment Method</FormLabel>
      <Select
        // 1. Connection Point (OUTPUT): When a user selects an item,
        // this `onValueChange` function is called. `field.onChange`
        // updates the main form's state.
        onValueChange={field.onChange}
        
        // 2. Connection Point (INPUT): The `defaultValue` tells the
        // Select component which item to show as currently selected,
        // based on the form's state.
        defaultValue={field.value}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="Cash">Cash</SelectItem>
          <SelectItem value="Bank">Bank</SelectItem>
          <SelectItem value="UPI">UPI</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

**The Connection Explained:** The `field` object from `react-hook-form` is the bridge.

*   **`field.value` (Data In):** The form tells the `Select` component, "The current value for `paymentMethod` is 'Cash'. Please display that."
*   **`field.onChange` (Data Out):** The user clicks on "Bank". The `Select` component's internal logic calls the function it received as `onValueChange`. In this case, it calls `field.onChange("Bank")`, which tells the parent form, "The user has chosen 'Bank'. Update your state."

---

### The Smart Combobox (`MasterDataCombobox`)

This is the advanced, searchable dropdown used everywhere you need to select from your business data. It's designed to handle hundreds or thousands of items efficiently.

**File of Interest:** `src/components/shared/MasterDataCombobox.tsx`

**How it Works & Connects:**

This component is much more sophisticated. It's a combination of a pop-up, a search command palette, and an intelligent filtering engine. The parent form provides:

*   **`options`**: An array of objects, where each object has a `value` (the unique ID) and a `label` (the name to display). Example: `[{ value: 'cust-123', label: 'ABC TRADERS' }]`.
*   **`value`**: The unique ID of the currently selected item (e.g., `cust-123`).
*   **`onChange`**: The function to call with the new ID when the user selects an item.
*   **`onAddNew` / `onEdit` (Optional)**: Functions that the combobox can call if the user wants to add or edit an item directly.

#### Component Code

This component is a mini-application in itself. It has its own state and logic.

```tsx
// Simplified from src/components/shared/MasterDataCombobox.tsx

export const MasterDataCombobox = ({
  value,      // INPUT: The ID of the currently selected item (e.g., 'cust-123')
  onChange,   // OUTPUT: The function to call when an item is selected
  options,    // INPUT: The full list of items to search (e.g., all customers)
  onAddNew,   // OUTPUT: The function to call to add a new item
  ...
}) => {
  // 1. Internal State Management
  const [open, setOpen] = React.useState(false); // Is the dropdown panel open?
  const [search, setSearch] = React.useState(""); // What is the user typing?

  // 2. The "Brain": Intelligent Filtering using `useMemo`
  const fuse = React.useMemo(() => new Fuse(options, { keys: ['label'] }), [options]);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options; // If search is empty, show all options
    return fuse.search(search).map(result => result.item); // Otherwise, return fuzzy-searched results
  }, [options, search, fuse]);

  // 3. The "Handler": Deciding what to do when an item is clicked
  const handleSelect = (selectedValue: string | undefined) => {
    onChange(selectedValue); // **CRITICAL**: Calls the parent's onChange function
    setOpen(false);          // Closes the dropdown
    setSearch("");           // Resets the search text
  };

  // 4. The "View": Rendering the UI
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button>
          {/* Finds the label for the currently selected 'value' ID */}
          {options.find((opt) => opt.value === value)?.label || "Select an option"}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch} // Updates the internal search state on every keystroke
          />
          <CommandList>
            {/* Maps over the filtered results */}
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)} // Connects click to the handler
              >
                <Check className={cn(value === option.value ? "opacity-100" : "opacity-0")} />
                {option.label}
              </CommandItem>
            ))}
            {/* The "Add New" button, which calls the parent's onAddNew function */}
            {onAddNew && (
              <CommandItem onSelect={onAddNew}>
                <Plus /> Add New
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
```

**The Connection Explained:** The connection points are the props. The component is designed to be a "black box".

*   **`options` (Data In):** The parent provides the raw data. The combobox doesn't know or care if it's customers or warehouses; it just knows it has a list of items with a `value` and a `label`.
*   **`value` (Data In):** The parent tells the combobox which item is currently selected by its ID. The combobox uses this to display the correct name on the button and to show the checkmark in the list.
*   **`onChange` (Data Out):** This is the primary output. When a user makes a selection, the combobox calls this function, sending the chosen item's unique `value` (ID) back to the parent. The parent form then updates its state.
*   **`onAddNew` / `onEdit` (Action Out):** These are "callback" props. The combobox doesn't know how to add or edit a customer. It just knows that when the "Add New" button is clicked, it must call the `onAddNew` function that its parent gave it. This is a powerful pattern that keeps the component reusable and decoupled from the parent's specific logic.