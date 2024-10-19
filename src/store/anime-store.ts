import { create } from 'zustand'
import { IAnimeDetails } from '@/types/anime-details'

interface IAnimeStore {
    anime: IAnimeDetails,
    setAnime: (state: IAnimeDetails) => void
    selectedEpisode: string,
    setSelectedEpisode: (state: string) => void
}

export const useAnimeStore = create<IAnimeStore>((set) => ({
    anime: {} as IAnimeDetails,
    setAnime: (state: IAnimeDetails) => set({ anime: state }),

    selectedEpisode: '',
    setSelectedEpisode: (state: string) => set({ selectedEpisode: state }),
}))
