import axios from "axios";

export const api = axios.create({
    baseURL: 'https://api.kitsunee.me/v2/hianime'
})