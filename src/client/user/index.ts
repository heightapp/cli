import Client from 'client';

const get = (client: Client) => async () => {
  const {data} = await client.request<{id: string, email: string}>('users/me');
  return data;
};

export default {
  get,
}
