import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      username: session.user.username,
      role: session.user.role
    }
  });
}
