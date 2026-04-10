export default function EventCardSkeleton() {
    return (
      <div className="skeleton-card">
        <div className="skeleton-badge" />
        <div className="skeleton-title" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
        <div className="skeleton-footer">
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
        </div>
        <style jsx>{`
          .skeleton-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow: hidden;
          }
          .skeleton-badge {
            width: 72px; height: 22px; border-radius: 20px;
            background: var(--surface2);
            animation: shimmer 1.4s infinite;
          }
          .skeleton-title {
            width: 75%; height: 20px; border-radius: 6px;
            background: var(--surface2);
            animation: shimmer 1.4s infinite 0.1s;
          }
          .skeleton-line {
            width: 100%; height: 14px; border-radius: 4px;
            background: var(--surface2);
            animation: shimmer 1.4s infinite 0.2s;
          }
          .skeleton-line.short { width: 55%; animation-delay: 0.3s; }
          .skeleton-footer { display: flex; gap: 8px; margin-top: 4px; }
          .skeleton-pill {
            width: 80px; height: 32px; border-radius: 8px;
            background: var(--surface2);
            animation: shimmer 1.4s infinite 0.4s;
          }
          @keyframes shimmer {
            0%   { opacity: 0.5; }
            50%  { opacity: 1; }
            100% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }