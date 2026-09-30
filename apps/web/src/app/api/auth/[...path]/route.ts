import { getNeonAuth } from '@/lib/auth/server';

type Handlers = ReturnType<ReturnType<typeof getNeonAuth>['handler']>;
export const GET = (...args: Parameters<Handlers['GET']>) => getNeonAuth().handler().GET(...args);
export const POST = (...args: Parameters<Handlers['POST']>) => getNeonAuth().handler().POST(...args);
