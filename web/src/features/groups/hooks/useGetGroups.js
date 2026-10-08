import { useQuery } from '@tanstack/react-query';
import { getGroups } from '../api/groupsApi';

export function useGetGroups() {
  return useQuery({
    queryKey: ['groups'], 
    queryFn: getGroups,   
  });
}