interface Props {
    type: 'events' | 'registrations' | 'participants' | 'search';
    message?: string;
  }
  
  const illustrations = {
    events: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--surface2)" />
        <rect x="35" y="40" width="50" height="42" rx="6" fill="var(--border)" />
        <rect x="35" y="38" width="50" height="12" rx="6" fill="var(--muted)" opacity="0.5" />
        <circle cx="47" cy="44" r="3" fill="var(--blue)" opacity="0.7" />
        <circle cx="73" cy="44" r="3" fill="var(--blue)" opacity="0.7" />
        <rect x="42" y="58" width="36" height="4" rx="2" fill="var(--border)" />
        <rect x="42" y="66" width="24" height="4" rx="2" fill="var(--border)" />
      </svg>
    ),
    registrations: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--surface2)" />
        <circle cx="60" cy="48" r="16" fill="var(--border)" />
        <path d="M30 88 Q30 72 60 72 Q90 72 90 88" fill="var(--border)" />
        <circle cx="60" cy="48" r="10" fill="var(--muted)" opacity="0.4" />
        <line x1="54" y1="84" x2="66" y2="84" stroke="var(--muted)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    search: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--surface2)" />
        <circle cx="54" cy="52" r="18" stroke="var(--muted)" strokeWidth="4" fill="none" opacity="0.5" />
        <line x1="67" y1="65" x2="82" y2="80" stroke="var(--muted)" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        <line x1="46" y1="52" x2="62" y2="52" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
        <line x1="46" y1="58" x2="56" y2="58" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    participants: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="50" fill="var(--surface2)" />
        <circle cx="44" cy="50" r="10" fill="var(--border)" />
        <circle cx="76" cy="50" r="10" fill="var(--border)" />
        <circle cx="60" cy="46" r="12" fill="var(--muted)" opacity="0.4" />
        <path d="M22 82 Q22 68 44 68 Q52 68 60 72 Q68 68 76 68 Q98 68 98 82" fill="var(--border)" opacity="0.5" />
      </svg>
    ),
  };
  
  const messages = {
    events: 'No events found',
    registrations: "You haven't registered for any events yet",
    participants: 'No participants yet',
    search: 'No results match your search',
  };
  
  export default function EmptyState({ type, message }: Props) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 24px', gap: '16px',
        color: 'var(--muted)', textAlign: 'center',
      }}>
        {illustrations[type]}
        <p style={{ fontSize: '15px', margin: 0 }}>{message || messages[type]}</p>
      </div>
    );
  }