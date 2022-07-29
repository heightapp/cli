import Client from 'client';

const get = (client: Client) => async () => {
  const {data} = await client.request<{preferences: {defaultListIds: Array<string>}}>('users/me/preferences');
  return data;
};

export default {
  get,
}
