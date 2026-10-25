export type PublicUser = {
  id: string;
  email: string;
  createdAt: Date;
};

export type AuthResult = {
  token: string;
  user: PublicUser;
};
