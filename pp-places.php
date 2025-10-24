<?php
/**
 * Plugin Name: PP Places
 * Description: CPT 'places' + tabela z AJAX (filtry, "Load more"). Wszystkie pola (name, address, nip, regon) w ACF. Edycja tylko przez wp-admin.
 * Version:     1.0.0
 * Author:      PP Solutions
 * License:     GPL-2.0+
 * Requires PHP: 7.4
 * Requires at least: 5.0
 */

defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'PP_Places_Plugin' ) ) {

	final class PP_Places_Plugin {

		/** @var PP_Places_Plugin */
		private static $instance;

		/** @var string */
		private $version = '1.0.0';

		/** @var string */
		private $slug = 'pp-places';

		/** @var string */
		private $ajax_action_fetch = 'pp_places_fetch';


		/** Singleton. */
		public static function instance() : PP_Places_Plugin {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/** Bootstrap. */
		private function __construct() {
			// CPT.
			add_action( 'init', [ $this, 'register_post_type' ] );

			// Assets.
			add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );

			// Shortcode.
			add_shortcode( 'pp_places', [ $this, 'shortcode_pp_places' ] );

			// AJAX (public + logged-out).
			add_action( "wp_ajax_{$this->ajax_action_fetch}", [ $this, 'ajax_fetch_places' ] );
			add_action( "wp_ajax_nopriv_{$this->ajax_action_fetch}", [ $this, 'ajax_fetch_places' ] );
		}

		/**
		 * Rejestracja CPT 'places'.
		 *
		 * @link https://developer.wordpress.org/plugins/post-types/registering-custom-post-types/
		 */
		public function register_post_type() : void {
			$labels = [
				'name'               => _x( 'Places', 'post type general name', 'pp-places' ),
				'singular_name'      => _x( 'Place', 'post type singular name', 'pp-places' ),
				'menu_name'          => _x( 'Places', 'admin menu', 'pp-places' ),
				'name_admin_bar'     => _x( 'Place', 'add new on admin bar', 'pp-places' ),
				'add_new'            => _x( 'Add New', 'place', 'pp-places' ),
				'add_new_item'       => __( 'Add New Place', 'pp-places' ),
				'new_item'           => __( 'New Place', 'pp-places' ),
				'edit_item'          => __( 'Edit Place', 'pp-places' ),
				'view_item'          => __( 'View Place', 'pp-places' ),
				'all_items'          => __( 'All Places', 'pp-places' ),
				'search_items'       => __( 'Search Places', 'pp-places' ),
				'parent_item_colon'  => __( 'Parent Places:', 'pp-places' ),
				'not_found'          => __( 'No places found.', 'pp-places' ),
				'not_found_in_trash' => __( 'No places found in Trash.', 'pp-places' ),
			];

			$args = [
				'labels'             => $labels,
				'public'             => true,
				'show_ui'            => true,
				'show_in_menu'       => true,
				'menu_position'      => 20,
				'supports'           => [ 'title' ],
				'has_archive'        => true,
				'show_in_rest'       => false,
				'capability_type'    => 'post',
				'map_meta_cap'       => true,
			];

			register_post_type( 'places', $args );
		}

		/**
		 * Enqueue skryptów i stylów.
		 *
		 * @link https://developer.wordpress.org/reference/functions/wp_enqueue_script/
		 */
		public function enqueue_assets() : void {
			if ( ! is_singular() && ! is_archive() ) {
				// Skrypt może być potrzebny tylko tam, gdzie jest shortcode – wykryjemy w runtime.
			}

			wp_register_script(
				$this->slug . '-js',
				plugins_url( 'assets/pp-places.js', __FILE__ ),
				[ 'jquery' ],
				$this->version,
				true
			);

			wp_localize_script(
				$this->slug . '-js',
				'PP_PLACES',
				[
					'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
					'nonce'     => wp_create_nonce( $this->slug . '_nonce' ),
					'actions'   => [
						'fetch'     => $this->ajax_action_fetch,
					],
					'i18n'      => [
						'loading'   => __( 'Loading…', 'pp-places' ),
						'no_results'=> __( 'No results', 'pp-places' ),
						'load_more' => __( 'Load more', 'pp-places' ),
					],
				]
			);

			wp_enqueue_style(
				$this->slug . '-css',
				plugins_url( 'assets/pp-places.css', __FILE__ ),
				[],
				$this->version
			);
		}

		/**
		 * Shortcode [pp_places].
		 *
		 * @link https://developer.wordpress.org/reference/functions/add_shortcode/
		 */
		public function shortcode_pp_places( $atts = [] ) : string {
			wp_enqueue_script( $this->slug . '-js' );

			// Domyślnie 2 na stronę
			$per_page = isset( $atts['per_page'] ) ? absint( $atts['per_page'] ) : 2;

			ob_start();
			?>
			<div class="pp-places" data-per-page="<?php echo esc_attr( $per_page ); ?>">
				<form class="pp-places__filters" aria-label="<?php echo esc_attr__( 'Filters', 'pp-places' ); ?>">
					<div>
						<label>
							<?php esc_html_e( 'Nazwa', 'pp-places' ); ?>
							<input type="text" name="name" />
						</label>
					</div>
					<div>
						<label>
							<?php esc_html_e( 'Adres', 'pp-places' ); ?>
							<input type="text" name="address" />
						</label>
					</div>
					<div>
						<label>
							<?php esc_html_e( 'NIP', 'pp-places' ); ?>
							<input type="text" name="nip" />
						</label>
					</div>
					<div>
						<label>
							<?php esc_html_e( 'REGON', 'pp-places' ); ?>
							<input type="text" name="regon" />
						</label>
					</div>
					<button type="submit"><?php esc_html_e( 'Filtruj', 'pp-places' ); ?></button>
				</form>

				<div class="pp-places__table-wrap">
					<table class="pp-places__table" aria-live="polite">
						<thead>
							<tr>
								<th><?php esc_html_e( 'Nazwa', 'pp-places' ); ?></th>
								<th><?php esc_html_e( 'Adres', 'pp-places' ); ?></th>
								<th><?php esc_html_e( 'NIP', 'pp-places' ); ?></th>
								<th><?php esc_html_e( 'REGON', 'pp-places' ); ?></th>
							</tr>
						</thead>
						<tbody></tbody>
					</table>
					<div class="pp-places__no-results" style="display:none;"></div>
				</div>

				<div class="pp-places__load-more-wrap">
					<button type="button" class="pp-places__load-more"><?php esc_html_e( 'Load more', 'pp-places' ); ?></button>
				</div>
			</div>
			<?php
			return ob_get_clean();
		}

		/**
		 * AJAX: pobierz listę miejsc wg filtrów + paginacja (Load More).
		 *
		 *
		 * @link https://developer.wordpress.org/plugins/javascript/ajax/
		 */
		public function ajax_fetch_places() : void {
			check_ajax_referer( $this->slug . '_nonce', 'nonce' );

			$page     = isset( $_POST['page'] ) ? max( 1, absint( $_POST['page'] ) ) : 1;
			$per_page = isset( $_POST['per_page'] ) ? min( 50, max( 1, absint( $_POST['per_page'] ) ) ) : 2;

			$name    = isset( $_POST['name'] )    ? sanitize_text_field( wp_unslash( $_POST['name'] ) )    : '';
			$address = isset( $_POST['address'] ) ? sanitize_text_field( wp_unslash( $_POST['address'] ) ) : '';
			$nip     = isset( $_POST['nip'] )     ? preg_replace( '/\D+/', '', (string) $_POST['nip'] )     : '';
			$regon   = isset( $_POST['regon'] )   ? preg_replace( '/\D+/', '', (string) $_POST['regon'] )   : '';

			$meta_query = [ 'relation' => 'AND' ];

			if ( $name !== '' ) {
				$meta_query[] = [
					'key'     => 'name',
					'value'   => $name,
					'compare' => 'LIKE',
				];
			}
			if ( $address !== '' ) {
				$meta_query[] = [
					'key'     => 'address',
					'value'   => $address,
					'compare' => 'LIKE',
				];
			}
			if ( $nip !== '' ) {
				$meta_query[] = [
					'key'     => 'nip',
					'value'   => $nip,
					'compare' => 'LIKE',
				];
			}
			if ( $regon !== '' ) {
				$meta_query[] = [
					'key'     => 'regon',
					'value'   => $regon,
					'compare' => 'LIKE',
				];
			}

			$args = [
				'post_type'      => 'places',
				'post_status'    => 'publish',
				'posts_per_page' => $per_page,
				'paged'          => $page,
				'orderby'        => 'title',
				'order'          => 'ASC',
				'meta_query'     => $meta_query,
				'no_found_rows'  => false,
			];



			$query = new \WP_Query( $args );

			$items = [];
			foreach ( $query->posts as $post ) {
				$full_address = (string) get_post_meta( $post->ID, 'address', true );

				$items[] = [
					'id'       => (int) $post->ID,
					'name'     => (string) get_post_meta( $post->ID, 'name', true ),
					'address'  => $full_address,
					'nip'      => (string) get_post_meta( $post->ID, 'nip', true ),
					'regon'    => (string) get_post_meta( $post->ID, 'regon', true ),
					'can_edit' => current_user_can( 'edit_post', $post->ID ),
				];
			}

			$max_num_pages = (int) $query->max_num_pages;
			$has_more      = $page < $max_num_pages;

			wp_send_json_success(
				[
					'items'    => $items,
					'has_more' => $has_more,
				]
			);
		}
	}

	// Inicjalizacja.
	PP_Places_Plugin::instance();
}
