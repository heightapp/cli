import Client from 'client';

const getDefault = (client: Client) => async () => {
  const {data} = await client.request<{id: string}>('lists/default');
  return data;
};

export default getDefault;
