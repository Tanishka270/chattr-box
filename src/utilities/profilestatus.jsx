// if profile is complete or not 
export const isProfileComplete = (user) => {
  if (!user) return false;

  return (
    user.profileCompleted === true ||
    (user.username && user.avatar && user.pronouns)
  );
};

export default isProfileComplete;