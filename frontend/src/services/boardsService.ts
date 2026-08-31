import { api } from "./api";
import { Board } from "@/types";

export interface BoardColumnInput {
  id?: string;
  name: string;
  color?: string;
  order?: number;
  isInitial?: boolean;
  isDone?: boolean;
  isCancelled?: boolean;
}

export const boardsService = {
  /** Board + colunas do departamento do usuário logado. */
  async getMine(): Promise<Board> {
    const { data } = await api.get("/boards/mine");
    return data.data;
  },
  /** Board + colunas de outro departamento — usado pelo seletor de quem tem acesso irrestrito. */
  async getForDepartment(departmentId: string): Promise<Board> {
    const { data } = await api.get(`/boards/department/${departmentId}`);
    return data.data;
  },
  async replaceColumns(boardId: string, columns: BoardColumnInput[]): Promise<Board> {
    const { data } = await api.put(`/boards/${boardId}/columns`, { columns });
    return data.data;
  },
};
