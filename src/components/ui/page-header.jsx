export function PageHeader({ title, description, action }) {
    return (<div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
          {title}
        </h1>
        {description && (<p className="mt-1 text-muted-foreground">{description}</p>)}
      </div>
      {action && <div>{action}</div>}
    </div>);
}
