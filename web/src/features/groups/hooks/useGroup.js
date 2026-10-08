import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export function useGroup(id) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });
}
