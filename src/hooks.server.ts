import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const res = await resolve(event);
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? '';
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID ?? '';
  const deploymentUrl = event.request.headers.get('x-vercel-deployment-url') ?? '';

  res.headers.set('x-app-commit', commit);
  res.headers.set('x-app-deployment-id', deploymentId);
  res.headers.set('x-app-deployment-url', deploymentUrl);
  res.headers.set('cache-control', 'no-store');
  return res;
};
