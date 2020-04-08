function hideSuitesWithout(className) {
    var suites = document.querySelectorAll('#report > .suite');

    for (var i = 0; i < suites.length; i++) {
        let suite = suites[i];

        var els = suite.getElementsByClassName(className);
        if (!els.length) {
            suite.classList.add('hidden');
        }
    }
}

function unhide() {
    var suites = document.getElementsByClassName('suite hidden');

    while (suites.length) {
        suites[0].classList.remove('hidden');
    }
}

function togglePasses() {
    var report = document.getElementById('report');

    report.classList.toggle('hide-passes');

    if (report.classList.contains('hide-passes')) {
        hideSuitesWithout('test fail');
    } else {
        unhide();
    }
}

document.getElementById('toggle-passes').addEventListener('click', function(e) {
    e.preventDefault();
    
    this.classList.toggle('checked');

    togglePasses();
});

var tests = document.getElementsByClassName('test');

for (var i = 0; i < tests.length; i++) {
    var elem = tests[i];
    var head = elem.children[0];

    head.onclick = function () {
        var code = this.parentElement.children[1];
        var display = code.style.display;

        if (display && display === 'block') {
            code.style.display = 'none';
        } else {
            code.style.display = 'block';
        }
    };
}