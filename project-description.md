# Descrição do Projeto

<!-- Descreva seu projeto aqui -->

SAAS HORALY SISTEMA DE AGENDAMENTO.

1-PAINEL ADMIN exemplo: /admin, paginas devem ser /admin/login /admin/dashboard /admin/estabelecimentos

Dashboard de Relatórios com:
- Filtros por período
- MRR
- Receita total
- Churn rate
- ARPU
- Estabelecimentos Ativos
- Estabelecimentos Inativos
- Clientes de Estabelecimentos
- Quantidade de Agendamentos
- Acessos em Tempo Real.

Estabelecimentos
- Visualização detalhada de dados o Estabelecimento, Adicionar, Editar Excluir, Bloquear.

Clientes
- Adicionar, Editar Excluir, Bloquear Visualização detalhada de dados do Cliente.

Serviços
- Serviços mais usados

Planos 
- Adicionar, Editar, Ativar, Desativar, gerenciar permissões por cada plano, se não tiver ativo a permissão no plano qualquer relcacionamento sobre fica desativado, exemplo se não for incluso Notificações no plano, não terá na dashboard do estabelecimento o ícone de Notificações.

Suporte Ticket
- Visualizar, Responder, Fechar, Etiqueta de Prioridade Conforme o Plano.


Notificações
- Criar, Enviar Individualmente para x Estabelecimento.


WhatsApp
- Conectar WhatsApp
- Disparo de Mensagens
- Criar Campanha, salva a Campanha.
- Fazer Disparo, Seleciona os Estabelecimentos, seleciona o delay de envio, salva e clica iniciar disparo.

Equipe
- Suporte.

Logs

2-Painel Estabelecimento exemplo: /login  /dashboard  /agenda

Dashboard Inteligente exemplos:
- Agenda Livre = 99% / + ou - 1% das vagas preenchidas
- Agendamentos = Total no período/ + ou - 100.0% vs período anterior
- Concluídos = Total no período/ + ou - 100.0% vs período anterior
- Confirmados = Total no período/ + ou - 100.0% vs período anterior
- Pendentes = Total no período/ + ou - 100.0% vs período anterior
- Cancelados = Total no período/ + ou - 100.0% vs período anterior
- Receita Total/Agendamentos concluídos = Total no período/ + ou - 100.0% vs período anterior
- Ticket Médio = Valor médio por atendimento = + ou - 0.0%vs período anterior

Na navbar sino de Caixa de Notificações
- Cada Mudança de Status de Agendamentos uma notificação.

“Na navbar {Dicas inteligentes} gerada ”Compara com Outros Estabelecimentos do nicho”
- Exemplo: Serviço x tem profissionais cobrando x, seria uma boa ideia aumentar o valor
- Exemplo: Faça um Combo, clientes que agendam x serviço tem probabilidade de agendar também, seria uma boa para seu faturamento” 
- Análises e insights


Agenda
- Filtro por Dia, semana ou mês atual.
- Relatório de Agendamentos Confirmado e Concluído. 
- Tela de proximo cliente, quando for a vez terá botão para iniciar um timer para calcular o tempo do atendimento real , ao concluir muda o status do agendamento e sobe o cliente do proximo horário. 
- Fila de espera, lista de clientes para o dia.

Agendamentos
- Adicionar, Visualização detalhada, Alterar Status: Pendente, Confirmado, Iniciado, Concluído ou Cancelado.

Clientes
•⁠  ⁠criar, editar, banir visualizar/Perfil detalhados de clientes
Histórico de atendimento pendente, concluido cancelado
Parâmetros para análise de clientes individualmente.

Profissionais: Se incluso no Plano.
•⁠  ⁠Adicionar, Editar, Visualizar , Excluir

Serviço 
•⁠  ⁠Adicionar, Promoção valor, valor com desconto se ativo, permite reagendamento? Permite cancelamento?, Editar, Excluir Ativar/Desativar

Link de Agendamento
•⁠  ⁠slug/url: meusaas.com/url-cliente
•⁠  ⁠cores do link
•⁠  ⁠slogan
•⁠  ⁠logo
•⁠  ⁠banner
•⁠  ⁠selecionar tema
•⁠  ⁠Selecionar Campos Obrigatórios no cadastro agendamento, Email, Sobre Nome, data de nascimento. Nome e Telefone obrigatórios.

Minha Conta
•⁠  ⁠email
•⁠  ⁠alterar senha
•⁠  ⁠senha antiga
•⁠  ⁠nova senha
•⁠  ⁠confirmar senha
Minha Empresa
•⁠  ⁠Dados da Empresa
•⁠  Horários de Funcionamento por Dia
•⁠  ⁠Alterar/Ativo/horario x a horário y: Horários de Funcionamento 
•⁠  ⁠Cadastrar/Apagar :Bloquear Dia.
•⁠ Limite de vagas por horário? Exemplo, cada slot de horário pré definido é 1 vaga mas pode ser maior o limite, exemplo 2/3 ou mais.
•⁠  ⁠Permitir Reagendamento/se sim configurar tempo de antecedência.
•⁠  ⁠Permitir Cancelamento/se sim configurar tempo de antecedência.
Data recorrente (repete todos os anos)
Marque esta opção para feriados fixos que ocorrem na mesma data todos os anos? True ou false, se true todo ano essa data fica indisponível
•⁠  ⁠Cadastrar/Apagar :Bloquear Horário
•⁠  ⁠gerar um ou definir :Cupom de Desconto
•⁠  ⁠Ativar Desativar Lista de Confiança e Lista Negra, se o cliente tiver na lista negra sempre cobrar sinal. Se estiver na lista branca, mesmo com o sinal ativo, não cobrar taxa.
•⁠ Receber Notificações?: randomizando com titulos emocionais de acordo com o tipo da notificação, exemplo “Titulo: Maravilha Agendamento Confirmado {nome do cliente}teve que cancelar” Agendamento Pendente, Agendamento Confirmado, Agendamento Cancelado, Agendamento Remarcado.

Pagamento
•⁠  ⁠Configurar Recebimento: Cobrar Taxa? Fixo ou %, se % de 10 a 100%, fixo estabelecimento define um valor de no mínimo 5 reais. 
•⁠  ⁠Cadastrar Credenciais Mercado Pago, salvar ou alterar, pode ser null

Integrações
•⁠  ⁠Conectar WhatsApp: puxa o qr code da evolution api quando conectar o qr code fecha e muda de Nenhuma instância conectada para WhatsApp conectado. 

•⁠  ⁠Facebook: somente id do pixel.
•⁠  ⁠Google analytcs: somente tag
•⁠  ⁠Google Tag: somente tag

Notificação e Lembretes
•⁠  ⁠Lembretes
•⁠  ⁠notificação 
•⁠  ⁠mensagem aniversário 
•⁠  ⁠promoções


Disparo de Mensagens
•⁠  ⁠Criar Campanha, salva a Campanha.
•⁠  ⁠Fazer Disparo, Seleciona os clientes, seleciona o delay de envio, salva e clica iniciar.

Meu Plano
•⁠  ⁠Planos de Assinatura do Saas, contratar, se atrasado renovar, se ativo cancelar ou atrasado opção de cancelar.

Suporte Ticket
- Visualizar, Responder, Fechar

3-fluxo de Agendamento (Cliente Final)
1. Acessa link público do estabelecimento
2. Seleciona serviço → Se disponível Data, se não for disponível horário e data fica desativado o click no botão e ou horário→ se disponivel/houver vaga Horário
3. Preenche dados pessoais/cupom se ativa alguma promoção mostra o campo de cupom para aplicar
4. Define forma de pagamento:
    * Pix (se houver sinal ou pagamento total)
    * Redirecionamento direto (gratuito)
5. Página de confirmação:
    * Resumo do agendamento
    * Botões: Adicionar ao calendário apple/google, Contato via WhatsApp, meus agendamentos, novo agendamento


4-Área do Cliente Final
Foco: Acompanhar histórico, pagamentos e ações rápidas.
📄 Páginas
* Histórico de Agendamentos: data, serviço, status, valor; filtros por status/estabelecimento
* Pagamentos e Sinais: valor, tipo, forma de pagamento
* Extras úteis:
    * Reagendar com 1 clique se permitido pelo estabelecimento ou o serviço permite
    * Contato WhatsApp
    * Favoritar serviços
    * Repetir agendamento





API PIX PARA O ESTABELECIMENTO COBRAR OS CLIENTES DELE VAMOS USAR A API DO MERCADO PAGO A V3. cada ESTABELECIMENTO VAI COBRAR O SEUS CLIENTES COM A SUA PROPRIA CHAVE. PARA PERIODO DE TESTE ESSA FUNCIONALIDADE DEVE FICAR DESATIVADA. para testar vamos usar esse token: APP_USR-6990151940405489-070418-94f2213186cf2ffcf6ff362d356c8655-604704839

composer require "mercadopago/dx-php:3.5.1"


para nós cobrarmos os estabelecimento as assinaturas mensais, semestrais ou anuais vamos deixar só o front pronto sem cobrar por enquanto pois vamos utilizar uma api no futuro diferente do mercado pago que vai ser apenas para os estabelecimentos cobrar via pix os seus clientes. 




#FBFAFA
#F4F2F0
#425164
#516673
#ECE9E6