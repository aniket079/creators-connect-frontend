export const normalizeAuthUser = (response) => {
  const user =
    response?.user ||
    response?.data?.user ||
    response?.currentUser ||
    response;

  if (!user || typeof user !== "object") {
    return user;
  }

  const tokenBalance =
    user.token ??
    user.tokens ??
    user.tokenBalance ??
    user.walletBalance ??
    user.credits;

  return {
    ...user,
    token: tokenBalance ?? 0
  };
};

export const getUserTokenBalance = (user) =>
  user?.token ??
  user?.tokens ??
  user?.tokenBalance ??
  user?.walletBalance ??
  user?.credits ??
  0;

export const getUserImage = (user) =>
  user?.avatar ||
  user?.profileImage ||
  user?.avatarUrl ||
  user?.image ||
  user?.photo ||
  user?.picture;
