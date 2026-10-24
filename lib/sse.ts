type Controller = ReadableStreamDefaultController<Uint8Array>;

const clients = new Map<string, Set<Controller>>();

export function broadcast(projectId: string, data: unknown): void {
  const projectClients = clients.get(projectId);
  if (!projectClients || projectClients.size === 0) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);

  for (const controller of projectClients) {
    try {
      controller.enqueue(encoded);
    } catch {
    }
  }
}

export function addClient(projectId: string, controller: Controller): void {
  if (!clients.has(projectId)) {
    clients.set(projectId, new Set());
  }
  clients.get(projectId)!.add(controller);
}

export function removeClient(projectId: string, controller: Controller): void {
  const projectClients = clients.get(projectId);
  if (projectClients) {
    projectClients.delete(controller);
    if (projectClients.size === 0) {
      clients.delete(projectId);
    }
  }
}
