import Client from 'client';

const getDefaultListIds = async (client: Client) => {
  // Fetch user's default list
  const {preferences} = await client.userPreference.get();
  const userDefaultListIds = preferences.defaultListIds;
  if (userDefaultListIds?.length) {
    return userDefaultListIds;
  }

  // Fetch workspace's default list
  const workspaceDefaultList = await client.view.getDefault();
  return [workspaceDefaultList.id];
};

export default getDefaultListIds;
