import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      role: string;
      technicianId: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: string;
    technicianId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    technicianId: string | null;
  }
}
