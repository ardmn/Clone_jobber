# Frontend Technical Requirements

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## 1. Technology Stack

### Recommended Framework: React + TypeScript

**Why React:**
- Large ecosystem and community
- Component reusability
- Excellent performance (Virtual DOM)
- Strong TypeScript support
- Rich library ecosystem

**Framework:** Next.js (React framework with SSR/SSG)

**Alternative Options:**
- Vue.js + TypeScript (Nuxt.js)
- Angular (TypeScript-first)

---

## 2. Core Technologies

### 2.1 Build Tools
- **Vite** or **Webpack** for bundling
- **TypeScript** 5+ for type safety
- **ESLint** + **Prettier** for code quality

### 2.2 State Management
- **Redux Toolkit** (complex state) OR
- **Zustand** (simpler alternative) OR
- **React Query** (server state) + **Context API** (UI state)

### 2.3 Routing
- **React Router v6** (SPA)
- **Next.js Router** (if using Next.js)

### 2.4 UI Component Library
- **Material-UI (MUI)** OR
- **Ant Design** OR
- **Chakra UI** OR
- **Custom components with Tailwind CSS**

### 2.5 Forms
- **React Hook Form** + **Zod** (validation)
- **Formik** (alternative)

### 2.6 Data Fetching
- **React Query** (recommended)
- **SWR** (alternative)
- **Axios** for HTTP client

### 2.7 Date/Time
- **date-fns** or **Day.js**

### 2.8 Drag & Drop
- **@dnd-kit** (modern, accessible)
- **react-beautiful-dnd** (alternative)

### 2.9 Calendar
- **FullCalendar** with React wrapper
- **react-big-calendar** (alternative)

### 2.10 PDF Generation
- **react-pdf** for viewing
- **jsPDF** or server-side generation

### 2.11 Rich Text Editor
- **TipTap** (headless, customizable)
- **Quill** (alternative)

### 2.12 Charts
- **Recharts** (React-native)
- **Chart.js** with react-chartjs-2

---

## 3. Application Architecture

### 3.1 Folder Structure

```
src/
├── assets/              # Static assets (images, fonts)
├── components/          # Reusable components
│   ├── common/          # Buttons, Inputs, Cards
│   ├── layout/          # Header, Sidebar, Footer
│   └── feature/         # Feature-specific components
├── features/            # Feature modules
│   ├── clients/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types.ts
│   ├── quotes/
│   ├── jobs/
│   ├── invoices/
│   ├── schedule/
│   └── dashboard/
├── hooks/               # Custom React hooks
├── services/            # API services
├── store/               # State management
├── routes/              # Route definitions
├── types/               # TypeScript types
├── utils/               # Utility functions
├── config/              # Configuration
├── styles/              # Global styles
└── App.tsx              # Root component
```

### 3.2 Component Patterns

**Container/Presentational Pattern:**
- Container: Logic and state
- Presentational: UI only

**Custom Hooks Pattern:**
```typescript
// useClients.ts
export const useClients = () => {
  const query = useQuery(['clients'], fetchClients);

  return {
    clients: query.data,
    isLoading: query.isLoading,
    error: query.error
  };
};
```

**Compound Components:**
```typescript
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Footer</Card.Footer>
</Card>
```

---

## 4. Key Features Implementation

### 4.1 Dashboard

**Components:**
- KPI Cards (revenue, jobs, invoices)
- Charts (revenue trends, job distribution)
- Recent activity feed
- Quick actions

**State Management:**
- React Query for dashboard data
- Auto-refresh every 30 seconds

### 4.2 Client Management

**Features:**
- Client list with search/filter
- Client detail view
- Client creation/edit form
- Client history timeline

**Implementation:**
```typescript
// ClientList.tsx
const ClientList = () => {
  const { clients, isLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients?.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <ClientTable clients={filteredClients} loading={isLoading} />
    </div>
  );
};
```

### 4.3 Quoting System

**Features:**
- Quote builder with line items
- Template selection
- Drag-and-drop reordering
- Live total calculation
- PDF preview
- Send quote modal

**Components:**
```
QuoteBuilder/
├── QuoteHeader.tsx          # Client, date, expiry
├── LineItemsTable.tsx       # Editable line items
├── LineItemRow.tsx          # Single line item
├── AddLineItemModal.tsx     # Add new item
├── QuoteTotals.tsx          # Subtotal, tax, total
├── QuoteTemplates.tsx       # Template selector
└── SendQuoteModal.tsx       # Send options
```

### 4.4 Calendar/Scheduling

**Library:** FullCalendar

**Views:**
- Day view
- Week view
- Month view
- Team member view

**Features:**
- Drag-and-drop scheduling
- Color-coding by status/team
- Click to view job details
- Quick reschedule
- Multi-select for bulk actions

**Implementation:**
```typescript
const ScheduleCalendar = () => {
  const { jobs } = useJobs();

  const events = jobs?.map(job => ({
    id: job.id,
    title: `${job.client.name} - ${job.service}`,
    start: job.scheduledAt,
    end: job.scheduledEnd,
    backgroundColor: getStatusColor(job.status),
    extendedProps: { job }
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      events={events}
      editable={true}
      eventDrop={handleEventDrop}
      eventClick={handleEventClick}
    />
  );
};
```

### 4.5 Invoicing

**Features:**
- Invoice list with filters
- Invoice detail view
- Payment status indicators
- Send invoice button
- Record payment modal
- Print/download PDF

**Components:**
- InvoiceList
- InvoiceDetail
- InvoicePreview (PDF)
- SendInvoiceModal
- RecordPaymentModal

### 4.6 Reporting

**Charts:**
- Revenue over time (line chart)
- Jobs by status (pie chart)
- Team performance (bar chart)
- Client acquisition (area chart)

**Filters:**
- Date range picker
- Team member filter
- Service type filter

**Export:**
- Export to PDF
- Export to Excel
- Email report

---

## 5. Responsive Design

### 5.1 Breakpoints

```css
/* Mobile first */
$breakpoint-sm: 640px;   /* Tablet */
$breakpoint-md: 768px;   /* Tablet landscape */
$breakpoint-lg: 1024px;  /* Desktop */
$breakpoint-xl: 1280px;  /* Large desktop */
```

### 5.2 Mobile Optimizations

**Navigation:**
- Collapsible sidebar on mobile
- Bottom navigation bar
- Hamburger menu

**Tables:**
- Horizontal scroll
- Card view on mobile
- Swipe actions

**Forms:**
- Stack fields vertically
- Larger input fields
- Bottom sheet modals

---

## 6. Performance Optimization

### 6.1 Code Splitting

**Route-based splitting:**
```typescript
const ClientsPage = lazy(() => import('./features/clients/ClientsPage'));
const QuotesPage = lazy(() => import('./features/quotes/QuotesPage'));
```

**Component lazy loading:**
```typescript
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

### 6.2 Memoization

```typescript
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() =>
    expensiveCalculation(data),
    [data]
  );

  const handleClick = useCallback(() => {
    // handle click
  }, []);

  return <div>{processedData}</div>;
});
```

### 6.3 Virtual Scrolling

For large lists (1000+ items):
```typescript
import { FixedSizeList } from 'react-window';

const ClientList = ({ clients }) => (
  <FixedSizeList
    height={600}
    itemCount={clients.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <ClientRow client={clients[index]} style={style} />
    )}
  </FixedSizeList>
);
```

### 6.4 Image Optimization

- Lazy load images
- Use WebP format
- Responsive images
- Image compression

### 6.5 Bundle Size

**Target:**
- Initial bundle: < 300KB (gzipped)
- Total bundle: < 1MB

**Monitoring:**
- webpack-bundle-analyzer
- Source Map Explorer

---

## 7. State Management Strategy

### 7.1 Server State (React Query)

**API data caching:**
```typescript
const useClients = () => {
  return useQuery(['clients'], fetchClients, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation(createClient, {
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    }
  });
};
```

### 7.2 UI State (Context API or Zustand)

**Global UI state:**
- Sidebar open/closed
- Current theme
- Active filters
- Modal state

```typescript
// Using Zustand
const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

---

## 8. Form Handling

### 8.1 React Hook Form + Zod

```typescript
const clientSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

const ClientForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = (data: ClientFormData) => {
    // Submit form
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('firstName')}
        error={errors.firstName?.message}
      />
      <Input
        {...register('email')}
        error={errors.email?.message}
      />
      <Button type="submit">Save</Button>
    </form>
  );
};
```

---

## 9. Authentication

### 9.1 Auth Context

```typescript
const AuthContext = createContext<AuthContextType>(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token).then(setUser).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password);
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 9.2 Protected Routes

```typescript
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  return children;
};
```

---

## 10. Error Handling

### 10.1 Error Boundary

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 10.2 API Error Handling

```typescript
const handleApiError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    toast.error('You do not have permission');
  } else {
    toast.error(error.response?.data?.message || 'An error occurred');
  }
};
```

---

## 11. Accessibility (a11y)

### 11.1 Requirements

- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management
- Color contrast (WCAG AA)

### 11.2 Implementation

```typescript
<button
  aria-label="Delete client"
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
</button>

<Modal
  isOpen={isOpen}
  onRequestClose={onClose}
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Delete</h2>
  <p id="modal-description">Are you sure?</p>
</Modal>
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

**Framework:** Jest + React Testing Library

```typescript
describe('ClientList', () => {
  it('renders client names', () => {
    const clients = [{ id: '1', name: 'John Doe' }];
    render(<ClientList clients={clients} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('filters clients by search term', () => {
    const clients = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ];
    render(<ClientList clients={clients} />);

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });
});
```

### 12.2 Integration Tests

Test user flows:
- Login → Dashboard
- Create Quote → Send Quote
- Complete Job → Generate Invoice

### 12.3 E2E Tests

**Framework:** Cypress or Playwright

```typescript
describe('Quote Creation', () => {
  it('creates and sends a quote', () => {
    cy.login('user@example.com', 'password');
    cy.visit('/quotes/new');

    cy.findByLabelText('Client').select('John Doe');
    cy.findByLabelText('Service').type('Lawn Mowing');
    cy.findByLabelText('Amount').type('100');

    cy.findByText('Save').click();
    cy.findByText('Send Quote').click();

    cy.findByText('Quote sent successfully').should('be.visible');
  });
});
```

---

## 13. Security

### 13.1 XSS Prevention

- Sanitize HTML input
- Use React's built-in escaping
- Content Security Policy headers

### 13.2 CSRF Protection

- CSRF tokens for forms
- SameSite cookie attribute

### 13.3 Secure Storage

```typescript
// DON'T store sensitive data in localStorage
// DO use httpOnly cookies for auth tokens

// If must store in localStorage, encrypt:
const encryptedData = encrypt(sensitiveData, key);
localStorage.setItem('data', encryptedData);
```

---

## 14. Progressive Web App (PWA)

### 14.1 Service Worker

**Features:**
- Offline page
- Cache API responses
- Background sync

### 14.2 Manifest

```json
{
  "name": "Jobber Clone",
  "short_name": "Jobber",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 15. Internationalization (i18n)

**Library:** react-i18next

```typescript
import { useTranslation } from 'react-i18next';

const ClientList = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('clients.title')}</h1>
      <button>{t('clients.addNew')}</button>
    </div>
  );
};
```

---

## Document Version Control
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
