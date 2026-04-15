import { prisma } from "@/lib/db";
import type { AuthSession } from "@/lib/auth";

type UsuarioComPapeis = {
  usuarioPapeis: Array<{
    papel: {
      codigo: string;
      permissoes: Array<{
        permissao: {
          codigo: string;
        };
      }>;
    };
  }>;
};

export function getAccessFromUser(user: UsuarioComPapeis | null) {
  if (!user) {
    return {
      roles: [] as string[],
      permissions: [] as string[],
    };
  }

  const roles = user.usuarioPapeis.map((item) => item.papel.codigo);
  const permissions = user.usuarioPapeis.flatMap((item) =>
    item.papel.permissoes.map((papelPermissao) => papelPermissao.permissao.codigo),
  );

  return {
    roles: Array.from(new Set(roles)),
    permissions: Array.from(new Set(permissions)),
  };
}

export async function getUserAccess(session: AuthSession) {
  const user = await prisma.usuario.findFirst({
    where: {
      id: session.userId,
      empresaId: session.empresaId,
    },
    include: {
      usuarioPapeis: {
        include: {
          papel: {
            include: {
              permissoes: {
                include: {
                  permissao: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return getAccessFromUser(user);
}

export function hasRole(
  access: { roles: string[]; permissions: string[] },
  roleCode: string,
) {
  return access.roles.includes(roleCode);
}

export function hasPermission(
  access: { roles: string[]; permissions: string[] },
  permissionCode: string,
) {
  return access.permissions.includes(permissionCode);
}
