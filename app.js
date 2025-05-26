// Datos iniciales con tus categorías específicas
const categorias = [
    // Ingresos
    { id: 'playstation', nombre: 'PlayStation', tipo: 'ingreso' },
    { id: 'diseno', nombre: 'Diseño Gráfico', tipo: 'ingreso' },
    { id: 'programacion', nombre: 'Programación web', tipo: 'ingreso' },
    { id: 'kiosko', nombre: 'Kiosko', tipo: 'ingreso' },
    { id: 'informatica', nombre: 'Informática', tipo: 'ingreso' },
    
    // Egresos
    { id: 'playstation-egreso', nombre: 'PlayStation', tipo: 'egreso' },
    { id: 'diseno-egreso', nombre: 'Diseño Gráfico', tipo: 'egreso' },
    { id: 'programacion-egreso', nombre: 'Programación web', tipo: 'egreso' },
    { id: 'kiosko-egreso', nombre: 'Kiosko', tipo: 'egreso' },
    { id: 'informatica-egreso', nombre: 'Informática', tipo: 'egreso' },
    { id: 'otros', nombre: 'Otros', tipo: 'egreso' }
];

let movimientos = [];
let editarModal = null;

// Cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modal de edición
    editarModal = new bootstrap.Modal(document.getElementById('editarModal'));
    
    // Configurar navegación por pestañas
    configurarPestanas();
    
    // Cargar categorías en el formulario
    cargarCategorias();
    
    // Configurar fecha actual por defecto
    document.getElementById('fecha-movimiento').valueAsDate = new Date();
    
    // Configurar formulario
    document.getElementById('form-movimiento').addEventListener('submit', guardarMovimiento);
    
    // Configurar filtros
    document.getElementById('filtro-periodo').addEventListener('change', actualizarReportes);
    document.getElementById('filtro-tipo').addEventListener('change', actualizarReportes);
    
    // Configurar botones del modal de edición
    document.getElementById('guardar-cambios-btn').addEventListener('click', guardarCambios);
    document.getElementById('eliminar-btn').addEventListener('click', eliminarMovimiento);
    
    // Cargar datos guardados
    cargarDatos();
});

function configurarPestanas() {
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover active de todos
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Agregar active al seleccionado
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Si es la pestaña de reportes, actualizar
            if (tabId === 'reportes') {
                actualizarReportes();
            }
        });
    });
}

function cargarCategorias() {
    const selectRegistro = document.getElementById('categoria-movimiento');
    const selectEditar = document.getElementById('editar-categoria');
    
    // Limpiar selects
    selectRegistro.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
    selectEditar.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
    
    // Cargar categorías según tipo seleccionado (ingreso por defecto)
    const tipo = document.querySelector('[name="tipo-movimiento"]:checked')?.value || 'ingreso';
    const categoriasFiltradas = categorias.filter(c => c.tipo === tipo);
    
    categoriasFiltradas.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        selectRegistro.appendChild(option.cloneNode(true));
        selectEditar.appendChild(option.cloneNode(true));
    });
    
    // Actualizar cuando cambie el tipo en el formulario principal
    document.querySelectorAll('[name="tipo-movimiento"]').forEach(radio => {
        radio.addEventListener('change', cargarCategorias);
    });
}

function cargarDatos() {
    const datosGuardados = localStorage.getItem('finanzas_data');
    if (datosGuardados) {
        movimientos = JSON.parse(datosGuardados);
        actualizarUI();
    } else {
        // Datos de ejemplo iniciales
        const hoy = new Date().toISOString().split('T')[0];
        movimientos = [
            { id: Date.now(), fecha: hoy, tipo: 'ingreso', categoria: 'playstation', descripcion: 'Alquiler PS4', monto: 5000 },
            { id: Date.now()+1, fecha: hoy, tipo: 'egreso', categoria: 'informatica-egreso', descripcion: 'Compra cables', monto: 2500 }
        ];
        guardarDatos();
        actualizarUI();
    }
}

function guardarDatos() {
    localStorage.setItem('finanzas_data', JSON.stringify(movimientos));
}

function guardarMovimiento(e) {
    e.preventDefault();
    
    const nuevoMovimiento = {
        id: Date.now(),
        fecha: document.getElementById('fecha-movimiento').value,
        tipo: document.querySelector('[name="tipo-movimiento"]:checked').value,
        categoria: document.getElementById('categoria-movimiento').value,
        descripcion: document.getElementById('descripcion-movimiento').value,
        monto: parseFloat(document.getElementById('monto-movimiento').value)
    };
    
    // Validaciones
    if (isNaN(nuevoMovimiento.monto) || nuevoMovimiento.monto <= 0) {
        alert('Ingrese un monto válido');
        return;
    }
    
    if (!nuevoMovimiento.categoria) {
        alert('Seleccione una categoría');
        return;
    }
    
    // Agregar y guardar
    movimientos.push(nuevoMovimiento);
    guardarDatos();
    
    // Actualizar UI y limpiar formulario
    actualizarUI();
    document.getElementById('form-movimiento').reset();
    document.getElementById('fecha-movimiento').valueAsDate = new Date();
    
    // Mostrar mensaje y volver a resumen
    alert('Movimiento registrado correctamente');
    document.querySelector('[data-tab="resumen"]').click();
}

function abrirEdicion(movimientoId) {
    const movimiento = movimientos.find(m => m.id === movimientoId);
    if (!movimiento) return;
    
    // Llenar formulario de edición
    document.getElementById('editar-id').value = movimiento.id;
    document.getElementById('editar-descripcion').value = movimiento.descripcion || '';
    document.getElementById('editar-monto').value = movimiento.monto;
    document.getElementById('editar-fecha').value = movimiento.fecha;
    
    // Seleccionar tipo correcto
    document.querySelector(`#editar-${movimiento.tipo}`).checked = true;
    
    // Cargar categorías correspondientes al tipo
    const selectEditar = document.getElementById('editar-categoria');
    selectEditar.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
    
    const categoriasFiltradas = categorias.filter(c => c.tipo === movimiento.tipo);
    categoriasFiltradas.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        if (categoria.id === movimiento.categoria) {
            option.selected = true;
        }
        selectEditar.appendChild(option);
    });
    
    // Mostrar modal
    editarModal.show();
}

function guardarCambios() {
    const id = parseInt(document.getElementById('editar-id').value);
    const movimientoIndex = movimientos.findIndex(m => m.id === id);
    
    if (movimientoIndex === -1) {
        alert('Movimiento no encontrado');
        return;
    }
    
    // Actualizar movimiento
    movimientos[movimientoIndex] = {
        id: id,
        fecha: document.getElementById('editar-fecha').value,
        tipo: document.querySelector('[name="editar-tipo"]:checked').value,
        categoria: document.getElementById('editar-categoria').value,
        descripcion: document.getElementById('editar-descripcion').value,
        monto: parseFloat(document.getElementById('editar-monto').value)
    };
    
    // Guardar y actualizar
    guardarDatos();
    actualizarUI();
    editarModal.hide();
    
    alert('Cambios guardados correctamente');
}

function eliminarMovimiento() {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) {
        return;
    }
    
    const id = parseInt(document.getElementById('editar-id').value);
    movimientos = movimientos.filter(m => m.id !== id);
    
    // Guardar y actualizar
    guardarDatos();
    actualizarUI();
    editarModal.hide();
    
    alert('Movimiento eliminado correctamente');
}

function actualizarUI() {
    actualizarResumen();
    actualizarUltimosMovimientos();
    actualizarCategoriasResumen();
    if (document.getElementById('reportes').classList.contains('active')) {
        actualizarReportes();
    }
}

function actualizarResumen() {
    const ingresos = movimientos
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    const egresos = movimientos
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + m.monto, 0);
    
    const balance = ingresos - egresos;
    
    document.getElementById('total-ingresos').textContent = formatearMoneda(ingresos);
    document.getElementById('total-egresos').textContent = formatearMoneda(egresos);
    document.getElementById('balance-total').textContent = formatearMoneda(balance);
}

function actualizarUltimosMovimientos() {
    const contenedor = document.getElementById('ultimos-movimientos');
    contenedor.innerHTML = '';
    
    const ultimos = [...movimientos]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);
    
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
    const resumen = {};
    movimientos.forEach(mov => {
        if (!resumen[mov.categoria]) {
            const cat = categorias.find(c => c.id === mov.categoria) || { nombre: mov.categoria, tipo: mov.tipo };
            resumen[mov.categoria] = {
                nombre: cat.nombre,
                tipo: cat.tipo,
                total: 0,
                cantidad: 0
            };
        }
        resumen[mov.categoria].total += mov.monto;
        resumen[mov.categoria].cantidad++;
    });
    
    // Mostrar las 5 principales
    Object.values(resumen)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .forEach(cat => {
            const chip = document.createElement('span');
            chip.className = `categoria-chip ${cat.tipo}-chip`;
            chip.innerHTML = `
                ${cat.nombre} 
                <span class="badge bg-light text-dark rounded-pill">${cat.cantidad}</span>
                <span class="fw-bold">${formatearMoneda(cat.total)}</span>
            `;
            contenedor.appendChild(chip);
        });
}

function actualizarReportes() {
    const periodo = document.getElementById('filtro-periodo').value;
    const tipo = document.getElementById('filtro-tipo').value;
    
    // Filtrar movimientos
    let filtrados = [...movimientos];
    
    // Por periodo
    const hoy = new Date();
    if (periodo === 'semana') {
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        filtrados = filtrados.filter(m => new Date(m.fecha) >= inicioSemana);
    } else if (periodo === 'mes') {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        filtrados = filtrados.filter(m => new Date(m.fecha) >= inicioMes);
    } else if (periodo === 'anio') {
        const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
        filtrados = filtrados.filter(m => new Date(m.fecha) >= inicioAnio);
    }
    
    // Por tipo
    if (tipo !== 'todos') {
        filtrados = filtrados.filter(m => m.tipo === tipo);
    }
    
    // Calcular resumen
    const total = filtrados.reduce((sum, m) => sum + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0);
    const ingresos = filtrados.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
    const egresos = filtrados.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
    
    // Actualizar resumen
    document.getElementById('resumen-reporte').innerHTML = `
        <div class="mb-2"><strong>Total:</strong> <span class="${total >= 0 ? 'text-success' : 'text-danger'}">${formatearMoneda(total)}</span></div>
        <div class="mb-2"><strong>Ingresos:</strong> <span class="text-success">${formatearMoneda(ingresos)}</span></div>
        <div class="mb-2"><strong>Egresos:</strong> <span class="text-danger">${formatearMoneda(egresos)}</span></div>
        <div><strong>Cantidad:</strong> ${filtrados.length} movimientos</div>
    `;
    
    // Actualizar lista
    const lista = document.getElementById('lista-reportes');
    lista.innerHTML = '';
    
    if (filtrados.length === 0) {
        lista.innerHTML = '<div class="text-center py-3 text-muted">No hay movimientos</div>';
        return;
    }
    
    // Ordenar por fecha (más nuevos primero)
    filtrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    filtrados.forEach(mov => {
        const cat = categorias.find(c => c.id === mov.categoria) || { nombre: mov.categoria };
        const item = document.createElement('div');
        item.className = 'card mb-2 position-relative';
        item.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${cat.nombre}</strong>
                        <div class="small text-muted">${mov.descripcion || 'Sin descripción'}</div>
                    </div>
                    <div class="${mov.tipo === 'ingreso' ? 'text-success' : 'text-danger'}">
                        ${mov.tipo === 'ingreso' ? '+' : '-'}${formatearMoneda(mov.monto)}
                    </div>
                </div>
                <div class="small text-muted mt-1">${formatearFecha(mov.fecha)}</div>
                <button class="btn btn-sm btn-outline-primary position-absolute top-0 end-0 mt-2 me-2 editar-btn">
                    <i class="bi bi-pencil"></i>
                </button>
            </div>
        `;
        
        item.querySelector('.editar-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirEdicion(mov.id);
        });
        
        lista.appendChild(item);
    });
}

function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(monto);
}

function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}