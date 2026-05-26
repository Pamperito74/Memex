var GraphShell = (function () {
  function nodeColor(value, confidence = 1.0) {
    // Premium Obsidian palette
    if (value >= 5) return '#10b981'; // hot -> bright emerald
    if (value >= 3) return '#34d399'; // warm -> soft emerald
    if (value >= 2) return '#0c0c0e'; // normal -> obsidian
    return '#0c0c0e'; // cold -> obsidian
  }

  function buildOptions(opts) {
    var reduced = opts && opts.reducedMotion;
    var base = {
      nodes: {
        shape: 'dot',
        font: { color: '#ffffff', size: 13, face: 'Inter' },
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: 'rgba(16, 185, 129, 0.2)',
          size: 10,
          x: 0,
          y: 0
        }
      },
      edges: {
        color: { color: '#1e1e22', highlight: '#10b981', opacity: 0.6 },
        smooth: { type: 'continuous', roundness: 0.5 },
        width: 1
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true
      }
    };

    if (reduced) {
      base.physics = { enabled: false };
    } else {
      base.physics = {
        enabled: true,
        forceAtlas2Based: {
          gravitationalConstant: -100,
          centralGravity: 0.005,
          springLength: 150,
          springConstant: 0.05,
          avoidOverlap: 0.5
        },
        maxVelocity: 40,
        solver: 'forceAtlas2Based',
        timestep: 0.3,
        stabilization: { iterations: 200, updateInterval: 25 }
      };
    }

    return base;
  }

  function setupSearch(network, nodes, inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', function (e) {
      var query = e.target.value.toLowerCase();
      if (!query) {
        nodes.forEach(function (node) {
          nodes.update({ id: node.id, opacity: 1, font: { color: '#e6edf3' } });
        });
        return;
      }

      var firstMatch = null;
      nodes.forEach(function (node) {
        var match = node.label.toLowerCase().includes(query);
        nodes.update({
          id: node.id,
          opacity: match ? 1 : 0.2,
          font: { color: match ? '#ffffff' : '#555555' }
        });
        if (match && firstMatch === null) firstMatch = node.id;
      });

      if (firstMatch !== null) {
        network.focus(firstMatch, { scale: 1.5, animation: true });
      }
    });
  }

  function saveState(pageId, network) {
    try {
      var scale = network.getScale();
      var position = network.getViewPosition();
      localStorage.setItem('graphShell.' + pageId, JSON.stringify({ scale: scale, position: position }));
    } catch (_) {}
  }

  function restoreState(pageId, network) {
    try {
      var raw = localStorage.getItem('graphShell.' + pageId);
      if (!raw) return;
      var state = JSON.parse(raw);
      if (state.scale && state.position) {
        network.moveTo({ position: state.position, scale: state.scale });
      }
    } catch (_) {}
  }

  function setupStateAutoSave(pageId, network) {
    network.on('dragEnd', function () { saveState(pageId, network); });
    network.on('zoom', function () { saveState(pageId, network); });
  }

  async function init(containerId, apiUrl, opts) {
    var container = document.getElementById(containerId);
    container.innerHTML = '<div class="empty-state" style="padding:40px"><svg><use href="#icon-graph"/></svg><p>Loading graph...</p></div>';

    var res = await fetch(apiUrl);
    var data = await res.json();

    var nodes = new vis.DataSet(data.nodes || []);
    var edges = new vis.DataSet(data.edges || []);
    var options = buildOptions(opts);
    var network = new vis.Network(container, { nodes: nodes, edges: edges }, options);

    return { network: network, nodes: nodes, edges: edges };
  }

  return {
    init: init,
    buildOptions: buildOptions,
    setupSearch: setupSearch,
    saveState: saveState,
    restoreState: restoreState,
    setupStateAutoSave: setupStateAutoSave,
    nodeColor: nodeColor
  };
})();
