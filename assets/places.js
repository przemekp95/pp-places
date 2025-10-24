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
		return `
			<tr data-id="${item.id}">
				<td>${nameLink}</td>
				<td>${escapeHtml(item.address || '')}</td>
				<td>${escapeHtml(item.nip || '')}</td>
				<td>${escapeHtml(item.regon || '')}</td>
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
	}

	$(function () {
		$('.places').each(function () {
			bind($(this));
		});
	});
})(jQuery);
