export interface Field {
    id: string;
    code: string;
    description: string;
    password?: string; // Now optional
    ownerId?: string; // New field
    createdAt: string;
}

export interface Player {
    id: string;
    name: string;
    roles: ('GK' | 'FIELD')[];
    fieldId: string;
    active: boolean;
    createdAt: string;
}

export interface GameEvent {
    id: string;
    playerId: string;
    type: 'GOAL' | 'ASSIST' | 'SAVE' | 'FOUL';
    timestamp: number;
}

export interface Contact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    createdAt: string;
}

export interface CreditTransaction {
    id: string;
    userId: string;
    tipo: 'COMPRA' | 'CONSUMO';
    quantidade: number;
    descricao: string;
    referencia?: string;
    dataHora: string;
}

export interface UsageSession {
    id: string;
    userId: string;
    inicio: string;
    fim?: string;
    minutosUtilizados?: number;
    creditosCobrados?: number;
    status: 'ABERTA' | 'FECHADA';
}
