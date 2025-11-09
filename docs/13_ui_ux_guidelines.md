# UI/UX Design Guidelines

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## 1. Design Principles

### Core Principles
1. **Simplicity** - Easy to use for non-technical field workers
2. **Efficiency** - Minimize clicks to complete tasks
3. **Consistency** - Uniform patterns throughout the app
4. **Accessibility** - WCAG 2.1 AA compliance
5. **Mobile-First** - Optimized for mobile/tablet use

---

## 2. Color Palette

### Primary Colors
```
Primary Blue:    #2563EB
Primary Dark:    #1E40AF
Primary Light:   #3B82F6
```

### Secondary Colors
```
Success Green:   #10B981
Warning Orange:  #F59E0B
Error Red:       #EF4444
Info Blue:       #3B82F6
```

### Neutral Colors
```
Gray 900: #111827  (Text primary)
Gray 700: #374151  (Text secondary)
Gray 500: #6B7280  (Text tertiary)
Gray 300: #D1D5DB  (Borders)
Gray 100: #F3F4F6  (Backgrounds)
White:    #FFFFFF
```

### Status Colors
```
Scheduled:   #2563EB (Blue)
In Progress: #F59E0B (Orange)
Completed:   #10B981 (Green)
Cancelled:   #6B7280 (Gray)
Overdue:     #EF4444 (Red)
```

---

## 3. Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale
```
H1: 36px / 2.25rem  (Bold, 600)
H2: 30px / 1.875rem (Bold, 600)
H3: 24px / 1.5rem   (Semibold, 600)
H4: 20px / 1.25rem  (Semibold, 600)
H5: 18px / 1.125rem (Medium, 500)
Body: 16px / 1rem   (Regular, 400)
Small: 14px / 0.875rem (Regular, 400)
Tiny: 12px / 0.75rem (Regular, 400)
```

### Line Height
```
Headings: 1.2
Body: 1.5
Small: 1.4
```

---

## 4. Spacing System

### Base Unit: 4px

```
2px  = 0.5 unit
4px  = 1 unit
8px  = 2 units
12px = 3 units
16px = 4 units
20px = 5 units
24px = 6 units
32px = 8 units
40px = 10 units
48px = 12 units
64px = 16 units
```

### Component Spacing
```
Padding (small):  8px
Padding (medium): 16px
Padding (large):  24px

Margin (small):  8px
Margin (medium): 16px
Margin (large):  32px

Gap (grid):  16px
Gap (flex):  8px
```

---

## 5. Component Library

### Buttons

```jsx
// Primary Button
<Button variant="primary">
  Save
</Button>

// Secondary Button
<Button variant="secondary">
  Cancel
</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

**Styles:**
```css
.btn-primary {
  background: #2563EB;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1E40AF;
}

.btn-primary:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
}
```

### Input Fields

```jsx
<Input
  label="Email"
  type="email"
  placeholder="Enter email"
  error="Email is required"
/>
```

**Styles:**
```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 16px;
}

.input:focus {
  border-color: #2563EB;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input.error {
  border-color: #EF4444;
}
```

### Cards

```jsx
<Card>
  <Card.Header>
    <h3>Client Details</h3>
  </Card.Header>
  <Card.Body>
    Content goes here
  </Card.Body>
  <Card.Footer>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```

**Styles:**
```css
.card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
}

.card-body {
  padding: 24px;
}
```

### Modals

```jsx
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>
    <h3>Confirm Action</h3>
  </Modal.Header>
  <Modal.Body>
    Are you sure you want to delete this client?
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>
      Cancel
    </Button>
    <Button variant="danger" onClick={onConfirm}>
      Delete
    </Button>
  </Modal.Footer>
</Modal>
```

### Tables

```jsx
<Table>
  <Table.Header>
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Email</Table.HeaderCell>
      <Table.HeaderCell>Status</Table.HeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {clients.map(client => (
      <Table.Row key={client.id}>
        <Table.Cell>{client.name}</Table.Cell>
        <Table.Cell>{client.email}</Table.Cell>
        <Table.Cell>
          <Badge variant={client.status}>
            {client.status}
          </Badge>
        </Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>
```

---

## 6. Layout Structure

### Desktop Layout
```
┌─────────────────────────────────────────┐
│ Header (64px height)                    │
├─────────┬───────────────────────────────┤
│         │                               │
│ Sidebar │ Main Content Area             │
│ (240px) │                               │
│         │                               │
│         │                               │
│         │                               │
└─────────┴───────────────────────────────┘
```

### Mobile Layout
```
┌───────────────────────┐
│ Header (56px)         │
├───────────────────────┤
│                       │
│ Main Content          │
│                       │
│                       │
│                       │
│                       │
├───────────────────────┤
│ Bottom Navigation     │
└───────────────────────┘
```

---

## 7. Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }

/* Large Desktop */
@media (min-width: 1280px) { }
```

---

## 8. Icons

### Icon Library: Heroicons or Lucide

### Icon Sizes
```
Small:  16px
Medium: 20px
Large:  24px
XLarge: 32px
```

### Usage
```jsx
<Icon name="user" size="md" />
<Icon name="calendar" size="lg" color="primary" />
```

---

## 9. Animation & Transitions

### Timing Functions
```css
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
ease-out: cubic-bezier(0, 0, 0.2, 1)
ease-in: cubic-bezier(0.4, 0, 1, 1)
```

### Duration
```
Fast: 150ms
Normal: 200ms
Slow: 300ms
```

### Common Transitions
```css
/* Hover effects */
transition: background-color 200ms ease;

/* Modal slide-in */
transition: transform 300ms ease-out;

/* Fade */
transition: opacity 200ms ease;
```

---

## 10. Accessibility

### WCAG 2.1 AA Requirements

**Color Contrast:**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Skip links for main content

**Screen Reader Support:**
```jsx
<button aria-label="Delete client">
  <Icon name="trash" />
</button>

<img src="photo.jpg" alt="Before photo of lawn" />

<Modal
  isOpen={isOpen}
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Delete</h2>
  <p id="modal-description">This action cannot be undone.</p>
</Modal>
```

**Focus Styles:**
```css
:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}
```

---

## 11. Loading States

### Skeleton Loaders
```jsx
<SkeletonLoader>
  <div className="skeleton-line" />
  <div className="skeleton-line" />
  <div className="skeleton-line short" />
</SkeletonLoader>
```

### Spinners
```jsx
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
```

### Progress Bars
```jsx
<ProgressBar value={65} max={100} />
```

---

## 12. Empty States

```jsx
<EmptyState
  icon="folder"
  title="No clients yet"
  description="Get started by adding your first client"
  action={
    <Button onClick={onAddClient}>
      Add Client
    </Button>
  }
/>
```

---

## 13. Error States

```jsx
<ErrorState
  title="Something went wrong"
  description="We couldn't load your clients. Please try again."
  action={
    <Button onClick={retry}>
      Try Again
    </Button>
  }
/>
```

---

## 14. Notifications/Toasts

```jsx
toast.success('Client created successfully');
toast.error('Failed to save changes');
toast.warning('Your session will expire soon');
toast.info('New feature available');
```

**Position:** Top-right corner
**Duration:** 3-5 seconds
**Dismissible:** Yes

---

## Document Version
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
