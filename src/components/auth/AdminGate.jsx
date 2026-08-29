import { useAuth } from '@/context/AuthContext';

export default function AdminGate({ children }) {
  const { configured, loading, user, isAdmin, signIn } = useAuth();

  if (!configured) {
    return <GateCard title="云端尚未配置" body="请先配置 Supabase 环境变量和数据库迁移，再使用管理功能。" />;
  }
  if (loading) return <GateCard title="正在确认身份" body="请稍候…" />;
  if (!user) {
    return (
      <GateCard title="管理员登录" body="公开题库无需登录；录入、编辑和发布题目需要使用 GitHub 登录。">
        <button type="button" className="btn-blue" onClick={signIn}>使用 GitHub 登录</button>
      </GateCard>
    );
  }
  if (!isAdmin) {
    return <GateCard title="没有管理权限" body={`当前账号 ${user.email ?? ''} 尚未加入 app_admins。`} />;
  }
  return children;
}

function GateCard({ title, body, children }) {
  return (
    <section className="surface-card-elevated mx-auto max-w-xl p-8 text-center">
      <h1 className="type-display-sm" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      <p className="type-body mt-3" style={{ color: 'var(--text-tertiary)' }}>{body}</p>
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
