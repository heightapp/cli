import Client from 'client';

const create = (client: Client) => async (body: {name: string, listIds?: Array<string>, assigneesIds?: Array<string>}) => {
  const {data} = await client.request<{index: number; name: string}>('tasks', {
    body,
    method: 'POST',
  });

  return data;
};

export default {
  create,
}
