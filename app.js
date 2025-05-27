const categorias = [
    { id: 'playstation', nombre: 'PlayStation', tipo: 'ingreso' },
    { id: 'diseno', nombre: 'Diseño Gráfico', tipo: 'ingreso' },
    { id: 'programacion', nombre: 'Programación web', tipo: 'ingreso' },
    { id: 'kiosko', nombre: 'Kiosko', tipo: 'ingreso' },
    { id: 'informatica', nombre: 'Informática', tipo: 'ingreso' },
    { id: 'playstation-egreso', nombre: 'PlayStation', tipo: 'egreso' },
    { id: 'diseno-egreso', nombre: 'Diseño Gráfico', tipo: 'egreso' },
    { id: 'programacion-egreso', nombre: 'Programación web', tipo: 'egreso' },
    { id: 'kiosko-egreso', nombre: 'Kiosko', tipo: 'egreso' },
    { id: 'informatica-egreso', nombre: 'Informática', tipo: 'egreso' },
    { id: 'otros', nombre: 'Otros', tipo: 'egreso' }
];

let movimientos = [];
let editarModal = null;

function obtenerFechaActual() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

document.addEventListener('DOMContentLoaded', function () {
    editarModal = new bootstrap.Modal(document.getElementById('editarModal'));
    configurarPestanas();
    cargarCategorias();
    document.getElementById('fecha-movimiento').value = obtenerFechaActual();
    document.getElementById('form-movimiento').addEventListener('submit', guardarMovimiento);
    document.getElementById('filtro-periodo').addEventListener('change', actualizarReportes);
    document.getElementById('filtro-tipo').addEventListener('change', actualizarReportes);
    document.getElementById('guardar-cambios-btn').addEventListener('click', guardarCambios);
    document.getElementById('eliminar-btn').addEventListener('click', eliminarMovimiento);
    cargarDatos();
});

function configurarPestanas() {
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            if (tabId === 'reportes') actualizarReportes();
        });
    });
}

function cargarCategorias() {
    const selectRegistro = document.getElementById('categoria-movimiento');
    const selectEditar = document.getElementById('editar-categoria');
    selectRegistro.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
    selectEditar.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
    const tipo = document.querySelector('[name="tipo-movimiento"]:checked')?.value || 'ingreso';
    const categoriasFiltradas = categorias.filter(c => c.tipo === tipo);
    categoriasFiltradas.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        selectRegistro.appendChild(option.cloneNode(true));
        selectEditar.appendChild(option.cloneNode(true));
    });
    document.querySelectorAll('[name="tipo-movimiento"]').forEach(radio => {
        radio.addEventListener('change', cargarCategorias);
    });
}

function cargarDatos() {
    const datosGuardados = localStorage.getItem('finanzas_data');
    if (datosGuardados) {
        movimientos = JSON.parse(datosGuardados).map(m => ({
            ...m,
            fecha: new Date(m.fecha)
        }));
    } else {
        const hoy = new Date();
        movimientos = [
            {
                id: Date.now(),
                fecha: new Date(`${obtenerFechaActual()}T00:00:00`),
                tipo: 'ingreso',
                categoria: 'playstation',
                descripcion: 'Alquiler PS4',
                monto: 5000
            },
            {
                id: Date.now() + 1,
                fecha: new Date(`${obtenerFechaActual()}T00:00:00`),
                tipo: 'egreso',
                categoria: 'informatica-egreso',
                descripcion: 'Compra cables',
                monto: 2500
            }
        ];
        guardarDatos();
    }
    actualizarUI();
}

function guardarDatos() {
    localStorage.setItem('finanzas_data', JSON.stringify(movimientos));
}

function guardarMovimiento(e) {
    e.preventDefault();

    const nuevoMovimiento = {
        id: Date.now(),
        fecha: new Date(document.getElementById('fecha-movimiento').value + 'T00:00:00'),
        tipo: document.querySelector('[name="tipo-movimiento"]:checked').value,
        categoria: document.getElementById('categoria-movimiento').value,
        descripcion: document.getElementById('descripcion-movimiento').value,
        monto: parseFloat(document.getElementById('monto-movimiento').value)
    };

    if (isNaN(nuevoMovimiento.monto) || nuevoMovimiento.monto <= 0) {
        alert('Ingrese un monto válido');
        return;
    }

    if (!nuevoMovimiento.categoria) {
        alert('Seleccione una categoría');
        return;
    }

    movimientos.unshift(nuevoMovimiento);
    guardarDatos();
    actualizarUI();
    document.getElementById('form-movimiento').reset();
    document.getElementById('fecha-movimiento').value = obtenerFechaActual();
    alert('Movimiento registrado correctamente');
    document.querySelector('[data-tab="resumen"]').click();
}

function abrirEdicion(movimientoId) {
    const movimiento = movimientos.find(m => m.id === movimientoId);
    if (!movimiento) return;
    
    document.getElementById('editar-id').value = movimiento.id;
    document.getElementById('editar-descripcion').value = movimiento.descripcion || '';
    document.getElementById('editar-monto').value = movimiento.monto;
    document.getElementById('editar-fecha').value = formatearFechaInput(movimiento.fecha);
    
    document.querySelectorAll('[name="editar-tipo"]').forEach(radio => {
        radio.checked = radio.value === movimiento.tipo;
    });
    
    const selectEditar = document.getElementById('editar-categoria');
    selectEditar.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
    const categoriasFiltradas = categorias.filter(c => c.tipo === movimiento.tipo);
    categoriasFiltradas.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        if (categoria.id === movimiento.categoria) option.selected = true;
        selectEditar.appendChild(option);
    });
    
    editarModal.show();
}

function formatearFechaInput(fecha) {
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function guardarCambios() {
    const id = parseInt(document.getElementById('editar-id').value);
    const movimientoIndex = movimientos.findIndex(m => m.id === id);
    if (movimientoIndex === -1) {
        alert('Movimiento no encontrado');
        return;
    }
    
    movimientos[movimientoIndex] = {
        id: id,
        fecha: new Date(document.getElementById('editar-fecha').value + 'T00:00:00'),
        tipo: document.querySelector('[name="editar-tipo"]:checked').value,
        categoria: document.getElementById('editar-categoria').value,
        descripcion: document.getElementById('editar-descripcion').value,
        monto: parseFloat(document.getElementById('editar-monto').value)
    };
    
    guardarDatos();
    actualizarUI();
    editarModal.hide();
    alert('Cambios guardados correctamente');
}

function eliminarMovimiento() {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return;
    const id = parseInt(document.getElementById('editar-id').value);
    movimientos = movimientos.filter(m => m.id !== id);
    guardarDatos();
    actualizarUI();
    editarModal.hide();
    alert('Movimiento eliminado correctamente');
}

function actualizarUI() {
    actualizarResumen();
    actualizarUltimosMovimientos();
    actualizarCategoriasResumen();
    if (document.getElementById('reportes')?.classList.contains('active')) {
        actualizarReportes();
    }
}

function actualizarResumen() {
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
    const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
    const balance = ingresos - egresos;
    document.getElementById('total-ingresos').textContent = formatearMoneda(ingresos);
    document.getElementById('total-egresos').textContent = formatearMoneda(egresos);
    document.getElementById('balance-total').textContent = formatearMoneda(balance);
}

function actualizarUltimosMovimientos() {
    const contenedor = document.getElementById('ultimos-movimientos');
    contenedor.innerHTML = '';
    const ultimos = [...movimientos].sort((a, b) => b.fecha - a.fecha || b.id - a.id).slice(0, 5);
    if (ultimos.length === 0) {
        contenedor.innerHTML = '<div class="text-center py-3 text-muted">No hay movimientos</div>';
        return;
    }
    ultimos.forEach(mov => {
        const categoria = categorias.find(c => c.id === mov.categoria) || { nombre: mov.categoria };
        const item = document.createElement('div');
        item.className = `list-group-item list-group-item-action ${mov.tipo} position-relative`;
        item.innerHTML = `
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${categoria.nombre}</strong>
                    <div class="small text-muted">${mov.descripcion || 'Sin descripción'}</div>
                </div>
                <div class="${mov.tipo === 'ingreso' ? 'text-success' : 'text-danger'}">
                    ${mov.tipo === 'ingreso' ? '+' : '-'}${formatearMoneda(mov.monto)}
                </div>
            </div>
            <div class="small text-muted mt-1">${formatearFecha(mov.fecha)}</div>
            <button class="btn btn-sm btn-outline-primary position-absolute top-50 end-0 translate-middle-y me-2 editar-btn">
                <i class="bi bi-pencil"></i>
            </button>
        `;
        item.querySelector('.editar-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirEdicion(mov.id);
        });
        contenedor.appendChild(item);
    });
}

function actualizarCategoriasResumen() {
    const contenedor = document.getElementById('categorias-container');
    contenedor.innerHTML = '';

    // Agrupar por categoría
    const categoriasResumen = {};
    movimientos.forEach(mov => {
        const cat = categorias.find(c => c.id === mov.categoria) || { nombre: mov.categoria };
        if (!categoriasResumen[mov.categoria]) {
            categoriasResumen[mov.categoria] = {
                nombre: cat.nombre,
                tipo: mov.tipo,
                total: 0
            };
        }
        categoriasResumen[mov.categoria].total += mov.monto;
    });

    // Ordenar por monto descendente
    const categoriasOrdenadas = Object.values(categoriasResumen).sort((a, b) => b.total - a.total);

    // Mostrar
    categoriasOrdenadas.forEach(cat => {
        const chip = document.createElement('span');
        chip.className = `categoria-chip ${cat.tipo}-chip`;
        chip.textContent = `${cat.nombre}: ${formatearMoneda(cat.total)}`;
        contenedor.appendChild(chip);
    });
}

function actualizarReportes() {
    const periodo = document.getElementById('filtro-periodo').value;
    const tipo = document.getElementById('filtro-tipo').value;
    
    // Filtrar movimientos
    let movimientosFiltrados = [...movimientos];
    
    // Filtrar por periodo
    const hoy = new Date();
    if (periodo === 'semana') {
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        movimientosFiltrados = movimientosFiltrados.filter(m => new Date(m.fecha) >= inicioSemana);
    } else if (periodo === 'mes') {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        movimientosFiltrados = movimientosFiltrados.filter(m => new Date(m.fecha) >= inicioMes);
    } else if (periodo === 'anio') {
        const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
        movimientosFiltrados = movimientosFiltrados.filter(m => new Date(m.fecha) >= inicioAnio);
    }
    
    // Filtrar por tipo
    if (tipo !== 'todos') {
        movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === tipo);
    }
    
    // Ordenar por fecha descendente
    movimientosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Actualizar resumen del reporte
    const ingresos = movimientosFiltrados.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
    const egresos = movimientosFiltrados.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
    const balance = ingresos - egresos;
    
    const resumenReporte = document.getElementById('resumen-reporte');
    resumenReporte.innerHTML = `
        <div class="d-flex justify-content-between mb-2">
            <span>Ingresos:</span>
            <span class="text-success">${formatearMoneda(ingresos)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
            <span>Egresos:</span>
            <span class="text-danger">${formatearMoneda(egresos)}</span>
        </div>
        <div class="d-flex justify-content-between fw-bold">
            <span>Balance:</span>
            <span class="${balance >= 0 ? 'text-success' : 'text-danger'}">${formatearMoneda(balance)}</span>
        </div>
    `;
    
    // Actualizar lista de movimientos
    const listaReportes = document.getElementById('lista-reportes');
    listaReportes.innerHTML = '';
    
    if (movimientosFiltrados.length === 0) {
        listaReportes.innerHTML = '<div class="text-center py-3 text-muted">No hay movimientos con estos filtros</div>';
        return;
    }
    
    movimientosFiltrados.forEach(mov => {
        const categoria = categorias.find(c => c.id === mov.categoria) || { nombre: mov.categoria };
        const item = document.createElement('div');
        item.className = `list-group-item list-group-item-action ${mov.tipo} mb-2`;
        item.innerHTML = `
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${categoria.nombre}</strong>
                    <div class="small text-muted">${mov.descripcion || 'Sin descripción'}</div>
                </div>
                <div class="${mov.tipo === 'ingreso' ? 'text-success' : 'text-danger'}">
                    ${mov.tipo === 'ingreso' ? '+' : '-'}${formatearMoneda(mov.monto)}
                </div>
            </div>
            <div class="small text-muted mt-1">${formatearFecha(mov.fecha)}</div>
            <button class="btn btn-sm btn-outline-primary editar-btn">
                <i class="bi bi-pencil"></i> Editar
            </button>
        `;
        item.querySelector('.editar-btn').addEventListener('click', () => abrirEdicion(mov.id));
        listaReportes.appendChild(item);
    });
}

function formatearMoneda(valor) {
    return `$${valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

function formatearFecha(fechaEntrada) {
    const fecha = (fechaEntrada instanceof Date) ? fechaEntrada : new Date(fechaEntrada);
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
}