/* global jQuery, PLACES */
(function ($) {
	'use strict';

	const state = {
		page: 1,
		perPage: 2,
		loading: false,
		lastFilters: {}
	};

	function getFilters($wrap) {
		const data = {};
		$wrap.find('.places__filters').serializeArray().forEach(it => {
			data[it.name] = it.value.trim();
		});
		return data;
	}

	function rowTpl(item) {
		const nameLink = escapeHtml(item.name || '');
		const editButtons = item.can_edit ? `
			<button type="button" class="places__edit-btn" data-id="${item.id}">
				${PLACES.i18n.edit}
			</button>
		` : '';

		return `
			<tr data-id="${item.id}">
				<td>${nameLink}</td>
				<td>${escapeHtml(item.address || '')}</td>
				<td>${escapeHtml(item.nip || '')}</td>
				<td>${escapeHtml(item.regon || '')}</td>
				<td>${editButtons}</td>
			</tr>
		`;
	}

	function editRowTpl(item) {
		return `
			<tr data-id="${item.id}" class="places__editing">
				<td><input type="text" name="name" value="${escapeHtml(item.name || '')}" /></td>
				<td><input type="text" name="address" value="${escapeHtml(item.address || '')}" /></td>
				<td><input type="text" name="nip" value="${escapeHtml(item.nip || '')}" /></td>
				<td><input type="text" name="regon" value="${escapeHtml(item.regon || '')}" /></td>
				<td>
					<button type="button" class="places__save-btn" data-id="${item.id}">
						${PLACES.i18n.save}
					</button>
					<button type="button" class="places__cancel-btn" data-id="${item.id}">
						${PLACES.i18n.cancel}
					</button>
				</td>
			</tr>
		`;
	}

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	function fetchPage($wrap, page, append = false) {
		if (state.loading) { return; }
		state.loading = true;

		const filters = getFilters($wrap);
		if (!append) {
			state.page = 1;
			state.lastFilters = filters;
		}
		const payload = Object.assign({}, filters, {
			action: PLACES.actions.fetch,
			nonce: PLACES.nonce,
			page: append ? state.page + 1 : 1,
			per_page: state.perPage
		});

		const $tbody = $wrap.find('.places__table tbody');
		const $nores = $wrap.find('.places__no-results');
		const $loadMore = $wrap.find('.places__load-more');

		if (!append) {
			$tbody.html('');
			$nores.hide().text('');
		}

		$loadMore.prop('disabled', true).text(PLACES.i18n.loading);

		$.post(PLACES.ajaxUrl, payload).done(function (res) {
			if (!res || !res.success) {
				console.error('AJAX Error:', res);
				$nores.text('Błąd ładowania danych').show();
				return;
			}
			const items = res.data.items || [];
			if (!append) {
				$tbody.html('');
			}
			if (items.length === 0 && state.page === 1) {
				$nores.text(PLACES.i18n.no_results).show();
			} else {
				items.forEach(item => $tbody.append(rowTpl(item)));
				$nores.hide();
			}
			if (res.data.has_more) {
				state.page = append ? state.page + 1 : 1;
				$loadMore.prop('disabled', false).text(PLACES.i18n.load_more).show();
			} else {
				$loadMore.prop('disabled', true).text(PLACES.i18n.load_more).hide();
			}
		}).fail(function (jqXHR, textStatus, errorThrown) {
			console.error('AJAX Fail:', textStatus, errorThrown);
			$nores.text('Błąd połączenia').show();
		}).always(function () {
			state.loading = false;
		});
	}

	function updatePlace($row, data) {
		const payload = Object.assign({}, data, {
			action: PLACES.actions.update,
			nonce: PLACES.nonce,
		});

		$.post(PLACES.ajaxUrl, payload).done(function (res) {
			if (!res || !res.success) {
				console.error('AJAX Update Error:', res);
				alert('Błąd aktualizacji danych');
				return;
			}

			// Zamień formularz edycji na normalny wiersz
			$row.replaceWith(rowTpl(res.data));
		}).fail(function (jqXHR, textStatus, errorThrown) {
			console.error('AJAX Update Fail:', textStatus, errorThrown);
			alert('Błąd połączenia');
		});
	}

	function bind($wrap) {
		const per = parseInt($wrap.attr('data-per-page'), 10);
		if (!isNaN(per) && per > 0) {
			state.perPage = per;
		}

		// Inicjalny fetch.
		fetchPage($wrap, 1, false);

		// Filtry: prevent default + fetchPage.
		$wrap.on('submit', '.places__filters', function (e) {
			e.preventDefault();
			state.page = 1;
			fetchPage($wrap, 1, false);
		});

		// Load more.
		$wrap.on('click', '.places__load-more', function () {
			fetchPage($wrap, state.page + 1, true);
		});

		// Edit button.
		$wrap.on('click', '.places__edit-btn', function () {
			const $btn = $(this);
			const $row = $btn.closest('tr');
			const itemId = $btn.data('id');

			// Pobierz aktualne dane z tabeli
			const name = $row.find('td').eq(0).text();
			const address = $row.find('td').eq(1).text();
			const nip = $row.find('td').eq(2).text();
			const regon = $row.find('td').eq(3).text();

			const item = {
				id: itemId,
				name: name,
				address: address,
				nip: nip,
				regon: regon,
				can_edit: true
			};

			// Zamień na formularz edycji
			$row.replaceWith(editRowTpl(item));
		});

		// Save button.
		$wrap.on('click', '.places__save-btn', function () {
			const $btn = $(this);
			const $row = $btn.closest('tr');
			const itemId = $btn.data('id');

			// Pobierz dane z formularza
			const name = $row.find('input[name="name"]').val();
			const address = $row.find('input[name="address"]').val();
			const nip = $row.find('input[name="nip"]').val();
			const regon = $row.find('input[name="regon"]').val();

			const data = {
				post_id: itemId,
				name: name,
				address: address,
				nip: nip,
				regon: regon
			};

			updatePlace($row, data);
		});

		// Cancel button.
		$wrap.on('click', '.places__cancel-btn', function () {
			const $btn = $(this);
			const $row = $btn.closest('tr');
			const itemId = $btn.data('id');

			// Pobierz aktualne dane z formularza
			const name = $row.find('input[name="name"]').val();
			const address = $row.find('input[name="address"]').val();
			const nip = $row.find('input[name="nip"]').val();
			const regon = $row.find('input[name="regon"]').val();

			const item = {
				id: itemId,
				name: name,
				address: address,
				nip: nip,
				regon: regon,
				can_edit: true
			};

			// Zamień na normalny wiersz
			$row.replaceWith(rowTpl(item));
		});
	}

	$(function () {
		$('.places').each(function () {
			bind($(this));
		});
	});
})(jQuery);
